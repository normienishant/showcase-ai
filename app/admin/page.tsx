// app/admin/page.tsx — Full with auto‑refresh, no flicker, session status, last page, and working visitor detail
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, FolderTree, Users, Settings, LogOut,
  Search, Plus, Edit, Trash2, Eye, Download, TrendingUp, Clock,
  Bell, User, X, Undo2, Loader2, FileDown, ArrowUpRight, Palette,
  ChevronRight, EyeOff, Save, Copy, Activity, BarChart3,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Countdown Toast ──────────────────────────────────────────
function UndoToast({ productName, onUndo, onConfirm }: { productName: string; onUndo: () => void; onConfirm: () => void }) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newVal = prev - 10;
        if (newVal <= 0) {
          clearInterval(intervalRef.current!);
          if (!confirmedRef.current) {
            confirmedRef.current = true;
            setTimeout(() => onConfirm(), 0);
          }
          return 0;
        }
        return newVal;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [onConfirm]);

  const seconds = Math.ceil(progress / 10);

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-full max-w-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 flex-1 min-w-[100px]">
          Deleted "{productName}"
        </span>
        <button
          onClick={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (!confirmedRef.current) {
              confirmedRef.current = true;
              onUndo();
            }
          }}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 shrink-0"
        >
          <Undo2 className="h-4 w-4" /> Undo
        </button>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1.5">
        <div className="h-full bg-blue-600 transition-all duration-1000 ease-linear" style={{ width: `${Math.max(0, progress)}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">{Math.max(0, seconds)}s left</div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  // ─── STATE ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'leads' | 'branding' | 'visitors'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Product modal ──
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', categoryId: '', specs: '', images: '' });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // ── Category modal ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', parentId: '', sortOrder: 0 });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // ── Lead detail modal ──
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [updatingLeadStatus, setUpdatingLeadStatus] = useState(false);

  // ── Pending deletions (for products) ──
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());

  // ── Branding ──
  const [branding, setBranding] = useState<any>({
    logoUrl: 'https://placehold.co/200x80/1a56db/white?text=BPE',
    primaryColor: '#1a56db',
    whatsappNumber: '+919311995859',
    websiteUrl: 'https://www.bpe.com',
    companyName: 'Showcase AI',
    tagline: 'Product Catalog Platform',
    email: 'sales@showcaseai.com',
    phone: '+91 98765 00000',
    address: 'Plot 45, MIDC Industrial Area, Pune',
  });

  // ── Visitors state ──
  const [visitors, setVisitors] = useState<any[]>([]);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [visitorEvents, setVisitorEvents] = useState<any[]>([]);
  const [visitorScore, setVisitorScore] = useState<any>(null);
  const [showVisitorDetail, setShowVisitorDetail] = useState(false);

  // ── Auto-refresh timer ──
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── EFFECTS ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.push('/admin/login');
    else setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('bpe-branding');
    if (saved) try { setBranding(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'visitors') {
      // Initial load with loading spinner
      loadVisitors(true);
      // Set up auto-refresh every 3 seconds (faster, with cache bust)
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = setInterval(() => {
        loadVisitors(false);
      }, 3000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, activeTab]);

  // ─── DATA FETCH ─────────────────────────────────────────────
  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const companyData = await api.getCompany('bpe');
      setCompany(companyData);
      const cats = await api.getCategories(companyData.id);
      setCategories(cats);
      const prods = await api.getProducts(companyData.id);
      setProducts(prods);
      const leadsData = await api.adminGetLeads(companyData.id);
      setLeads(leadsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadVisitors = async (showLoading: boolean = true) => {
    if (showLoading) {
      setVisitorLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      // Add cache‑busting query param
      const url = `${API_URL}/track/sessions?limit=20&_=${Date.now()}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.sessions) {
        const now = new Date();
        const sessionsWithDetails = data.sessions.map((session: any) => {
          const sortedEvents = [...(session.events || [])].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const latestEvent = sortedEvents[0];
          let lastPage = 'Unknown';
          if (latestEvent) {
            if (latestEvent.eventType === 'page_view' && latestEvent.eventData?.path) {
              lastPage = latestEvent.eventData.path;
            } else if (latestEvent.eventType === 'product_view' && latestEvent.productId) {
              lastPage = `/product/${latestEvent.productId}`;
            } else if (latestEvent.eventType === 'ai_chat') {
              lastPage = 'AI Chat';
            } else {
              lastPage = latestEvent.eventType || 'Unknown';
            }
          }
          // Session status: Active if last activity <5 min, else Inactive
          const lastActivityDate = new Date(session.lastActivity);
          const diffMinutes = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);
          const status = diffMinutes < 5 ? 'Active' : 'Inactive';
          return { ...session, lastPage, status };
        });
        setVisitors(sessionsWithDetails);
        console.log(`✅ Visitors loaded: ${sessionsWithDetails.length} sessions`);
      } else {
        console.warn('No sessions in response');
      }
    } catch (error) {
      console.error('Failed to load visitors:', error);
      if (showLoading) toast.error('Failed to load visitor data');
    } finally {
      setVisitorLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadVisitorDetail = async (visitorId: string) => {
    try {
      const response = await fetch(`${API_URL}/track/visitor/${visitorId}?_=${Date.now()}`);
      const data = await response.json();
      setVisitorEvents(data.events || []);
      setVisitorScore(data.score || null);
      setSelectedVisitor(visitorId);
      setShowVisitorDetail(true);
    } catch (error) {
      toast.error('Failed to load visitor details');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
    toast.info('Logged out');
  };

  // ─── PRODUCT CRUD ──────────────────────────────────────────
  const openProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        specs: Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
        images: (product.images || []).join(', '),
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', description: '', categoryId: '', specs: '', images: '' });
    }
    setShowProductModal(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      const specsObj: Record<string, string> = {};
      productForm.specs.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) specsObj[key.trim()] = val.join(':').trim();
      });
      const imagesArr = productForm.images.split(',').map(s => s.trim()).filter(Boolean);
      const data = {
        name: productForm.name,
        description: productForm.description,
        categoryId: productForm.categoryId,
        specs: specsObj,
        images: imagesArr,
        isVisible: true,
      };
      if (editingProduct) {
        await api.adminUpdateProduct(editingProduct.id, data);
        toast.success('Product updated successfully!');
      } else {
        await api.adminCreateProduct(data);
        toast.success('Product added successfully!');
      }
      setShowProductModal(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const deleteProduct = async (product: any) => {
    setPendingDeletions(prev => new Set(prev).add(product.id));
    let undoClicked = false;
    toast.custom(
      (t) => (
        <UndoToast
          productName={product.name}
          onUndo={() => {
            undoClicked = true;
            setPendingDeletions(prev => {
              const newSet = new Set(prev);
              newSet.delete(product.id);
              return newSet;
            });
            toast.dismiss(t);
            toast.success(`Restored "${product.name}"`);
          }}
          onConfirm={() => {
            if (!undoClicked) {
              setPendingDeletions(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
              });
              toast.dismiss(t);
              api.adminDeleteProduct(product.id)
                .then(() => {
                  toast.success(`Permanently deleted "${product.name}"`);
                  loadData();
                })
                .catch(() => toast.error('Failed to delete product'));
            }
          }}
        />
      ),
      { duration: 10000, onAutoClose: () => {
          setPendingDeletions(prev => {
            const newSet = new Set(prev);
            newSet.delete(product.id);
            return newSet;
          });
        }}
    );
  };

  // ─── CATEGORY CRUD ──────────────────────────────────────────
  const openCategoryModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name || '',
        parentId: category.parentId || '',
        sortOrder: category.sortOrder || 0,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', parentId: '', sortOrder: 0 });
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      const data = {
        name: categoryForm.name,
        parentId: categoryForm.parentId || null,
        sortOrder: categoryForm.sortOrder || 0,
      };
      if (editingCategory) {
        await api.adminUpdateCategory(editingCategory.id, data);
        toast.success('Category updated successfully!');
      } else {
        await api.adminCreateCategory(data);
        toast.success('Category added successfully!');
      }
      setShowCategoryModal(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save category');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await api.adminDeleteCategory(id);
        toast.success(`Category "${name}" deleted`);
        await loadData();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  // ─── LEAD DETAIL ────────────────────────────────────────────
  const openLeadDetail = (lead: any) => {
    setSelectedLead(lead);
  };

  const updateLeadStatus = async (status: string) => {
    if (!selectedLead) return;
    setUpdatingLeadStatus(true);
    try {
      await api.adminUpdateLeadStatus(selectedLead.id, status);
      toast.success('Lead status updated');
      setSelectedLead({ ...selectedLead, status });
      await loadData();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingLeadStatus(false);
    }
  };

  // ─── CSV EXPORT ─────────────────────────────────────────────
  const exportLeadsCSV = () => {
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Message', 'Status', 'Created At'];
    const rows = leads.map(l => [
      l.name,
      l.email,
      l.phone || '',
      l.company || '',
      l.message || '',
      l.status,
      new Date(l.createdAt).toLocaleString(),
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Leads exported');
  };

  // ─── BRANDING ───────────────────────────────────────────────
  const saveBranding = () => {
    localStorage.setItem('bpe-branding', JSON.stringify(branding));
    toast.success('Branding settings saved (local storage)');
  };

  // ─── RENDER LOGIC ──────────────────────────────────────────
  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── UI constants ──────────────────────────────────────────
  const statusColors = {
    new: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
    contacted: 'bg-green-100 text-green-700 border-green-200',
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'visitors', label: 'Visitors', icon: Activity },
    { id: 'branding', label: 'Branding', icon: Settings },
  ];

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'blue' },
    { label: 'Categories', value: categories.length, icon: FolderTree, color: 'green' },
    { label: 'Leads', value: leads.length, icon: Users, color: 'yellow' },
    { label: 'Conversion Rate', value: leads.length > 0 ? `${Math.round((leads.length / (leads.length + 10)) * 100)}%` : '0%', icon: TrendingUp, color: 'purple' },
  ];

  const chartData = [
    { month: 'Jan', leads: 12, downloads: 45 },
    { month: 'Feb', leads: 18, downloads: 62 },
    { month: 'Mar', leads: 14, downloads: 53 },
    { month: 'Apr', leads: 24, downloads: 88 },
    { month: 'May', leads: 31, downloads: 110 },
    { month: 'Jun', leads: 48, downloads: 143 },
  ];

  const activity = [
    { action: 'New inquiry from Rajesh Mehta — InfraCorp Engineering', time: '2 hours ago', type: 'lead' },
    { action: 'PDF catalog downloaded — 5 products, 3 categories', time: '4 hours ago', type: 'download' },
    { action: 'Product "1 MVA Transformer" specification updated', time: '6 hours ago', type: 'product' },
  ];

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f2f5f8] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 bg-[#0b1f3a] text-white flex-col shrink-0 h-screen sticky top-0">
        <div className="h-14 flex items-center px-4 border-b border-[#1f3a5c]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1a6b3c] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" fill="#1a6b3c"/>
                <path d="M10 6L6 8.5V12.5L10 15L14 12.5V8.5L10 6Z" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-wide leading-none font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Showcase AI</p>
              <p className="text-[8px] text-[#44617a] uppercase tracking-widest leading-none mt-0.5">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {menuItems.map(item => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 px-4 py-3 text-[12px] font-600 uppercase tracking-wide border-l-2 transition-all w-full ${
                  active
                    ? 'border-[#1a6b3c] bg-[#1a6b3c]/10 text-white'
                    : 'border-transparent text-[#7a9cc8] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={14} />
                {item.label}
                {active && <ChevronRight size={10} className="ml-auto text-[#1a6b3c]" />}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#1f3a5c] py-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-600 uppercase tracking-wide text-[#44617a] hover:text-red-400 transition-colors">
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#e8edf3] flex items-center justify-between px-5 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-700 uppercase text-[#0b1f3a]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#1a6b3c] rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#e8edf3]">
              <div className="w-7 h-7 bg-[#0b1f3a] flex items-center justify-center">
                <span className="text-white text-[10px] font-700">A</span>
              </div>
              <span className="hidden sm:block text-[12px] font-600 text-[#0b1f3a]">Administrator</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <>
              <div className="border-b border-[#e8edf3] pb-4">
                <h1 className="text-[24px] text-[#0b1f3a] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                  Dashboard Overview
                </h1>
                <p className="text-[12px] text-[#5a6e82] mt-0.5">Catalog platform activity as of June 2026</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(card => (
                  <div key={card.label} className="bg-white border border-[#e8edf3] p-5 hover:border-[#cdd5de] transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-9 h-9 flex items-center justify-center" style={{ backgroundColor: '#0b1f3a15' }}>
                        <card.icon size={16} color="#0b1f3a" />
                      </div>
                      <ArrowUpRight size={12} className="text-[#cdd5de] group-hover:text-[#5a6e82] transition-colors" />
                    </div>
                    <p className="text-[32px] text-[#0b1f3a] leading-none mb-1 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{card.value}</p>
                    <p className="text-[11px] text-[#5a6e82] uppercase tracking-wide font-600">{card.label}</p>
                    <p className="text-[11px] text-[#9ab0c4] mt-0.5">+3 this month</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 bg-white border border-[#e8edf3] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[16px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Platform Growth</p>
                      <p className="text-[11px] text-[#9ab0c4] mt-0.5">Leads and PDF downloads · Last 6 months</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0b1f3a" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#0b1f3a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a6b3c" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#1a6b3c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ab0c4' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ab0c4' }} axisLine={false} tickLine={false} width={26} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: '2px', fontSize: '11px', fontFamily: 'DM Mono, monospace' }} />
                      <Area type="monotone" dataKey="downloads" stroke="#0b1f3a" strokeWidth={1.5} fill="url(#g1)" name="Downloads" />
                      <Area type="monotone" dataKey="leads" stroke="#1a6b3c" strokeWidth={1.5} fill="url(#g2)" name="Leads" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white border border-[#e8edf3] p-5">
                  <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Recent Activity</p>
                  <div className="mt-4 space-y-3.5">
                    {activity.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.type === 'lead' ? 'bg-[#1a6b3c]' : a.type === 'download' ? 'bg-[#b45309]' : 'bg-[#0b1f3a]'}`} />
                        <div>
                          <p className="text-[12px] text-[#4a5668] leading-snug">{a.action}</p>
                          <p className="text-[10px] text-[#9ab0c4] mt-0.5 flex items-center gap-1"><Clock size={9} /> {a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#e8edf3]">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8edf3] bg-[#f8fafc]">
                  <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Recent Leads</p>
                  <button className="text-[11px] text-[#1a6b3c] font-600 hover:underline uppercase tracking-wide">View All →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e8edf3]">
                        {['Name / Company', 'Products of Interest', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-5 py-2.5 text-left text-[10px] font-600 text-[#9ab0c4] uppercase tracking-widest bg-[#f8fafc]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 5).map((lead) => (
                        <tr key={lead.id} className="border-b border-[#f2f5f8] hover:bg-[#f8fafc] transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-[12px] text-[#0b1f3a] font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{lead.name}</p>
                            <p className="text-[11px] text-[#9ab0c4]">{lead.company}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[11px] text-[#5a6e82]">{lead.products?.length || 0} products</span>
                          </td>
                          <td className="px-5 py-3.5" style={{ fontFamily: 'DM Mono, monospace' }}>
                            <span className="text-[11px] text-[#9ab0c4]">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 text-[10px] font-700 uppercase tracking-wide border ${
                              lead.status === 'new' ? 'border-[#0b1f3a] text-[#0b1f3a] bg-[#0b1f3a]/5' :
                              lead.status === 'contacted' ? 'border-[#1565c0] text-[#1565c0] bg-[#1565c0]/5' :
                              lead.status === 'qualified' ? 'border-[#1a6b3c] text-[#1a6b3c] bg-[#1a6b3c]/5' :
                              'border-[#b45309] text-[#b45309] bg-[#b45309]/5'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCTS TAB ── */}
          {activeTab === 'products' && (
            <div className="bg-white border border-[#e8edf3]">
              <div className="flex items-center justify-between p-5 border-b border-[#e8edf3] bg-[#f8fafc]">
                <div className="flex items-center gap-4">
                  <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Product Management</p>
                  <span className="text-[11px] text-[#9ab0c4]">{products.length} products</span>
                </div>
                <button onClick={() => openProductModal()} className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                  <Plus size={13} /> Add Product
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8edf3]">
                      {['Product', 'Category', 'Model No.', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-600 text-[#9ab0c4] uppercase tracking-widest bg-[#f8fafc]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => {
                      const isPending = pendingDeletions.has(p.id);
                      return (
                        <tr key={p.id} className={`border-b border-[#f2f5f8] hover:bg-[#f8fafc] transition-colors ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#eef1f5] overflow-hidden shrink-0 border border-[#e8edf3]">
                                <img src={(p.images && p.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="text-[12px] text-[#0b1f3a] font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{p.name}</p>
                                <p className="text-[10px] text-[#9ab0c4] truncate max-w-[180px]">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] text-[#5a6e82]">{categories.find(c => c.id === p.categoryId)?.name || 'Uncategorized'}</span>
                          </td>
                          <td className="px-4 py-3.5" style={{ fontFamily: 'DM Mono, monospace' }}>
                            <span className="text-[11px] text-[#9ab0c4]">{p.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-0.5 text-[10px] font-700 uppercase tracking-wide border ${
                              p.isVisible ? 'border-[#1a6b3c] text-[#1a6b3c] bg-[#1a6b3c]/5' : 'border-[#b45309] text-[#b45309] bg-[#b45309]/5'
                            }`}>
                              {p.isVisible ? 'Active' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openProductModal(p)} className="p-1.5 hover:bg-[#f2f5f8] text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors border border-transparent hover:border-[#e8edf3]">
                                <Edit size={13} />
                              </button>
                              <button onClick={() => !isPending && deleteProduct(p)} disabled={isPending} className={`p-1.5 hover:bg-red-50 text-[#9ab0c4] hover:text-red-500 transition-colors border border-transparent hover:border-red-200 ${isPending ? 'opacity-40' : ''}`}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── CATEGORIES TAB ── */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-[#e8edf3] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Category Tree</p>
                <button onClick={() => openCategoryModal()} className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                  <Plus size={13} /> Add Category
                </button>
              </div>
              <ul className="space-y-2">
                {categories.filter(c => c.parentId === null).map(cat => (
                  <li key={cat.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center gap-3 py-2">
                      <FolderTree size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-800" style={{ fontFamily: 'Barlow, sans-serif' }}>{cat.name}</span>
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
                        {categories.filter(c => c.parentId === cat.id).length}
                      </Badge>
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => openCategoryModal(cat)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => deleteCategory(cat.id, cat.name)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <ul className="ml-8 space-y-1">
                      {categories.filter(c => c.parentId === cat.id).map(sub => (
                        <li key={sub.id} className="flex items-center justify-between py-1 text-sm text-gray-600">
                          <span className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-300 rounded-full" /> {sub.name}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openCategoryModal(sub)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
                              <Edit size={11} />
                            </button>
                            <button onClick={() => deleteCategory(sub.id, sub.name)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ─── LEADS TAB ── */}
          {activeTab === 'leads' && (
            <div className="bg-white border border-[#e8edf3]">
              <div className="flex items-center justify-between p-5 border-b border-[#e8edf3] bg-[#f8fafc]">
                <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Lead Management</p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#9ab0c4]">{leads.length} total · {leads.filter(l => l.status === 'new').length} new</span>
                  <button onClick={exportLeadsCSV} className="flex items-center gap-2 px-4 py-2 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                    <FileDown size={13} /> Export CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8edf3]">
                      {['Contact', 'Company', 'Products', 'Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-600 text-[#9ab0c4] uppercase tracking-widest bg-[#f8fafc]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-[#f2f5f8] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-[#0b1f3a] flex items-center justify-center shrink-0">
                              <span className="text-white text-[10px] font-700">{lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-[12px] text-[#0b1f3a] font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{lead.name}</p>
                              <p className="text-[10px] text-[#9ab0c4]">{lead.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-[#5a6e82]">{lead.company}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-[#5a6e82]">{lead.products?.length || 0} products</span>
                        </td>
                        <td className="px-4 py-3.5" style={{ fontFamily: 'DM Mono, monospace' }}>
                          <span className="text-[11px] text-[#9ab0c4]">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 text-[10px] font-700 uppercase tracking-wide border ${statusColors[lead.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => openLeadDetail(lead)} className="p-1.5 hover:bg-gray-100 rounded text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors border border-transparent hover:border-[#e8edf3]">
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">No leads submitted yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── VISITORS TAB ── (Updated: faster refresh, cache bust, full data) */}
          {activeTab === 'visitors' && (
            <div className="bg-white border border-[#e8edf3]">
              <div className="flex items-center justify-between p-5 border-b border-[#e8edf3] bg-[#f8fafc]">
                <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Visitor Intelligence
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#9ab0c4]">{visitors.length} active sessions</span>
                  <button
                    onClick={() => loadVisitors(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[11px] font-600 uppercase tracking-wide transition-colors"
                  >
                    <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
              </div>
              {visitorLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#0b1f3a] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : visitors.length === 0 ? (
                <div className="text-center py-12 text-[#9ab0c4]">No visitor sessions recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e8edf3]">
                        {['Visitor ID', 'Session ID', 'Last Activity', 'Status', 'Last Page', 'Intent Score', 'Events', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-600 text-[#9ab0c4] uppercase tracking-widest bg-[#f8fafc]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((session) => (
                        <tr key={session.id} className="border-b border-[#f2f5f8] hover:bg-[#f8fafc] transition-colors">
                          <td className="px-4 py-3.5 font-mono text-[11px] text-[#0b1f3a]">{session.visitorId.slice(0, 12)}</td>
                          <td className="px-4 py-3.5 font-mono text-[10px] text-[#9ab0c4]">{session.sessionId.slice(0, 12)}</td>
                          <td className="px-4 py-3.5 text-[11px] text-[#5a6e82]">{new Date(session.lastActivity).toLocaleString()}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide border ${
                              session.status === 'Active'
                                ? 'border-[#1a6b3c] text-[#1a6b3c] bg-[#1a6b3c]/5'
                                : 'border-[#b45309] text-[#b45309] bg-[#b45309]/5'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-mono text-[#1a6b3c] bg-[#f2f5f8] px-2 py-0.5">
                              {session.lastPage || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 text-[10px] font-700 uppercase tracking-wide border ${
                              (session.intentScore || 0) > 50 ? 'border-[#1a6b3c] text-[#1a6b3c] bg-[#1a6b3c]/5' :
                              (session.intentScore || 0) > 20 ? 'border-[#b45309] text-[#b45309] bg-[#b45309]/5' :
                              'border-[#9ab0c4] text-[#9ab0c4] bg-[#f2f5f8]'
                            }`}>
                              {session.intentScore || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-[#5a6e82]">{session.eventCount || 0}</td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => loadVisitorDetail(session.visitorId)}
                              className="p-1.5 hover:bg-gray-100 rounded text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors border border-transparent hover:border-[#e8edf3]"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── BRANDING TAB ── */}
          {activeTab === 'branding' && (
            <div className="bg-white border border-[#e8edf3] p-5 max-w-2xl space-y-5">
              <div>
                <h3 className="text-[16px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Branding Settings</h3>
                <p className="text-[12px] text-[#5a6e82] mt-0.5">Customize branding applied to PDF catalogs and platform identity.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Company Name</label>
                  <input value={branding.companyName || ''} onChange={e => setBranding({ ...branding, companyName: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Tagline</label>
                  <input value={branding.tagline || ''} onChange={e => setBranding({ ...branding, tagline: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Email</label>
                  <input value={branding.email || ''} onChange={e => setBranding({ ...branding, email: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Phone</label>
                  <input value={branding.phone || ''} onChange={e => setBranding({ ...branding, phone: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Website</label>
                  <input value={branding.websiteUrl || ''} onChange={e => setBranding({ ...branding, websiteUrl: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Address</label>
                  <textarea value={branding.address || ''} onChange={e => setBranding({ ...branding, address: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors resize-none" />
                </div>
              </div>
              <button onClick={saveBranding} className="flex items-center gap-2 px-6 py-3 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[12px] font-600 uppercase tracking-wide transition-colors">
                <Save size={14} /> Save Settings
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ─── PRODUCT MODAL ── */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveProduct} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Product Name *</label>
                <Input required placeholder="e.g., EPX+ 20kVA" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                <Input placeholder="Brief description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Category *</label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Specifications</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white font-mono text-sm" rows={4} placeholder="Capacity: 20kVA&#10;Efficiency: Up to 96.8%" value={productForm.specs} onChange={e => setProductForm({ ...productForm, specs: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">One spec per line: <span className="font-mono">key: value</span></p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Images (comma separated URLs)</label>
                <Input placeholder="https://cloudinary.com/img1.jpg, https://cloudinary.com/img2.jpg" value={productForm.images} onChange={e => setProductForm({ ...productForm, images: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-[#1e3a5f] hover:bg-[#16293f] text-white" disabled={submittingProduct}>
                  {submittingProduct ? <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</span> : (editingProduct ? 'Update Product' : 'Add Product')}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CATEGORY MODAL ── */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveCategory} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Category Name *</label>
                <Input required placeholder="e.g., Three Phase UPS" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Parent Category</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white" value={categoryForm.parentId} onChange={e => setCategoryForm({ ...categoryForm, parentId: e.target.value })}>
                  <option value="">None (Top-level)</option>
                  {categories.filter(c => c.parentId === null).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Sort Order</label>
                <Input type="number" placeholder="0" value={categoryForm.sortOrder} onChange={e => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-[#1e3a5f] hover:bg-[#16293f] text-white" disabled={submittingCategory}>
                  {submittingCategory ? <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</span> : (editingCategory ? 'Update Category' : 'Add Category')}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LEAD DETAIL MODAL ── */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Lead Details</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Name</p><p className="font-medium">{selectedLead.name}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Email</p><p>{selectedLead.email}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Phone</p><p>{selectedLead.phone || 'N/A'}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Company</p><p>{selectedLead.company || 'N/A'}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Message</p><p className="text-sm">{selectedLead.message || 'N/A'}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Wishlist Snapshot</p>
                {selectedLead.wishlistSnapshot && selectedLead.wishlistSnapshot.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm">
                    {selectedLead.wishlistSnapshot.map((item: any) => (
                      <li key={item.id}>{item.name} (Qty: {item.quantity || 1})</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">No products selected</p>}
              </div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateLeadStatus(e.target.value)}
                    disabled={updatingLeadStatus}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                  </select>
                  {updatingLeadStatus && <span className="w-4 h-4 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Created</p><p className="text-sm">{new Date(selectedLead.createdAt).toLocaleString()}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VISITOR DETAIL MODAL ── */}
      {showVisitorDetail && selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Visitor Details</h3>
              <button onClick={() => { setShowVisitorDetail(false); setSelectedVisitor(null); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Visitor ID</p><p className="font-mono text-sm">{selectedVisitor}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Intent Score</p><p className="font-bold text-lg">{visitorScore?.score || 0}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wider">Events</p>
                {visitorEvents.length === 0 ? (
                  <p className="text-sm text-slate-400">No events recorded.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {visitorEvents.slice(0, 50).map((ev) => (
                      <div key={ev.id} className="flex justify-between text-sm border-b border-slate-100 py-1.5">
                        <span className="text-slate-600">{ev.eventType}</span>
                        <span className="text-slate-400 text-xs">{new Date(ev.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}