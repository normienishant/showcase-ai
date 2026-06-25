// app/admin/page.tsx — Figma UI (Logic Unchanged)
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, FolderTree, Users, Settings, LogOut,
  Search, Plus, Edit, Trash2, Eye, Download, TrendingUp, Clock,
  Bell, User, X, Undo2, Loader2, FileDown, ArrowUpRight, Palette,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ─── Countdown Toast (same as before) ──────────────────────────
function UndoToast({
  productName,
  onUndo,
  onConfirm,
}: {
  productName: string;
  onUndo: () => void;
  onConfirm: () => void;
}) {
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
        <div
          className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
          style={{ width: `${Math.max(0, progress)}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {Math.max(0, seconds)}s left
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  // ─── STATE (unchanged) ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'leads' | 'branding'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    specs: '',
    images: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Pending deletions
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());

  // Branding
  const [branding, setBranding] = useState({
    logoUrl: 'https://placehold.co/200x80/1a56db/white?text=BPE',
    primaryColor: '#1a56db',
    whatsappNumber: '+919311995859',
    websiteUrl: 'https://www.bpe.com',
  });

  // ─── EFFECTS (unchanged) ────────────────────────────────────
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

  // ─── DATA FETCH (unchanged) ──────────────────────────────────
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
    toast.info('Logged out');
  };

  // ─── CRUD (unchanged) ──────────────────────────────────────
  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        specs: Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
        images: (product.images || []).join(', '),
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', categoryId: '', specs: '', images: '' });
    }
    setShowModal(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const specsObj: Record<string, string> = {};
      formData.specs.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) specsObj[key.trim()] = val.join(':').trim();
      });
      const imagesArr = formData.images.split(',').map(s => s.trim()).filter(Boolean);
      const data = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
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
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
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

  const saveBranding = () => {
    localStorage.setItem('bpe-branding', JSON.stringify(branding));
    toast.success('Branding settings saved!');
  };

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

  // ─── UI constants (unchanged) ──────────────────────────────
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
      {/* Sidebar (Figma style) */}
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
                {active && <ChevronRightIcon size={10} className="ml-auto text-[#1a6b3c]" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#1f3a5c] py-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-600 uppercase tracking-wide text-[#44617a] hover:text-red-400 transition-colors"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
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
                    <p className="text-[32px] text-[#0b1f3a] leading-none mb-1 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {card.value}
                    </p>
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
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          a.type === 'lead' ? 'bg-[#1a6b3c]' : a.type === 'download' ? 'bg-[#b45309]' : 'bg-[#0b1f3a]'
                        }`} />
                        <div>
                          <p className="text-[12px] text-[#4a5668] leading-snug">{a.action}</p>
                          <p className="text-[10px] text-[#9ab0c4] mt-0.5 flex items-center gap-1">
                            <Clock size={9} /> {a.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Leads table */}
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
                      {leads.slice(0, 5).map((lead, i) => (
                        <tr key={lead.id} className={`border-b border-[#f2f5f8] hover:bg-[#f8fafc] transition-colors ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}>
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

          {/* ── PRODUCTS TAB (Figma style) ── */}
          {activeTab === 'products' && (
            <div className="bg-white border border-[#e8edf3]">
              <div className="flex items-center justify-between p-5 border-b border-[#e8edf3] bg-[#f8fafc]">
                <div className="flex items-center gap-4">
                  <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Product Management</p>
                  <span className="text-[11px] text-[#9ab0c4]">{products.length} products</span>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
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
                              <button onClick={() => openModal(p)} className="p-1.5 hover:bg-[#f2f5f8] text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors border border-transparent hover:border-[#e8edf3]">
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

          {/* ── CATEGORIES TAB (Figma style) ── */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-[#e8edf3] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Category Tree</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
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
                    </div>
                    <ul className="ml-8 space-y-1">
                      {categories.filter(c => c.parentId === cat.id).map(sub => (
                        <li key={sub.id} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                          <span className="w-2 h-2 bg-gray-300 rounded-full" /> {sub.name}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── LEADS TAB (Figma style) ── */}
          {activeTab === 'leads' && (
            <div className="bg-white border border-[#e8edf3]">
              <div className="flex items-center justify-between p-5 border-b border-[#e8edf3] bg-[#f8fafc]">
                <p className="text-[14px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Lead Management</p>
                <span className="text-[11px] text-[#9ab0c4]">{leads.length} total · {leads.filter(l => l.status === 'new').length} new</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8edf3]">
                      {['Contact', 'Company', 'Products', 'Date', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-600 text-[#9ab0c4] uppercase tracking-widest bg-[#f8fafc]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={lead.id} className={`border-b border-[#f2f5f8] hover:bg-[#f8fafc] transition-colors ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-[#0b1f3a] flex items-center justify-center shrink-0">
                              <span className="text-white text-[10px] font-700">
                                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
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
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">No leads submitted yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BRANDING TAB (Figma style) ── */}
          {activeTab === 'branding' && (
            <div className="bg-white border border-[#e8edf3] p-5 max-w-2xl space-y-5">
              <div>
                <h3 className="text-[16px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Branding Settings</h3>
                <p className="text-[12px] text-[#5a6e82] mt-0.5">Customize branding applied to PDF catalogs and platform identity.</p>
              </div>

              {/* Logo */}
              <div>
                <p className="text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Company Logo</p>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-16 border-2 border-dashed border-[#cdd5de] flex items-center justify-center bg-[#f2f5f8] overflow-hidden">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center"><Upload size={16} className="text-[#9ab0c4] mx-auto mb-1" /><p className="text-[9px] text-[#9ab0c4] uppercase tracking-wide">Upload</p></div>
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[11px] font-600 uppercase tracking-wide cursor-pointer transition-colors">
                      <Upload size={12} />
                      Upload Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setBranding(b => ({ ...b, logoUrl: URL.createObjectURL(file) }));
                      }} />
                    </label>
                    <p className="text-[11px] text-[#9ab0c4] mt-1.5">PNG or SVG · Max 2MB · Transparent background</p>
                  </div>
                </div>
              </div>

              {/* Company info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Company Name</label>
                  <input value={branding.companyName || ''} onChange={e => setBranding(b => ({ ...b, companyName: e.target.value }))} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Tagline</label>
                  <input value={branding.tagline || ''} onChange={e => setBranding(b => ({ ...b, tagline: e.target.value }))} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Email</label>
                  <input value={branding.email || ''} onChange={e => setBranding(b => ({ ...b, email: e.target.value }))} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Phone</label>
                  <input value={branding.phone || ''} onChange={e => setBranding(b => ({ ...b, phone: e.target.value }))} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Website</label>
                  <input value={branding.websiteUrl || ''} onChange={e => setBranding(b => ({ ...b, websiteUrl: e.target.value }))} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Address</label>
                  <textarea value={branding.address || ''} onChange={e => setBranding(b => ({ ...b, address: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors resize-none" />
                </div>
              </div>

              {/* Brand Colors */}
              <div>
                <p className="text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Brand Colors</p>
                <p className="text-[11px] text-[#9ab0c4] mb-4">Applied to PDF catalog headers, CTA buttons, and branded elements.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Primary (Headings)</label>
                    <div className="flex items-center gap-2.5">
                      <input type="color" value={branding.primaryColor || '#0b1f3a'} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} className="w-9 h-9 border border-[#cdd5de] cursor-pointer p-0.5" />
                      <input value={branding.primaryColor || ''} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} className="flex-1 px-3 py-2 bg-[#f8fafc] border border-[#cdd5de] text-[12px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-600 text-[#5a6e82] uppercase tracking-wide mb-1.5">Accent (CTAs)</label>
                    <div className="flex items-center gap-2.5">
                      <input type="color" value={branding.accentColor || '#1a6b3c'} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))} className="w-9 h-9 border border-[#cdd5de] cursor-pointer p-0.5" />
                      <input value={branding.accentColor || ''} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))} className="flex-1 px-3 py-2 bg-[#f8fafc] border border-[#cdd5de] text-[12px] text-[#0b1f3a] outline-none focus:border-[#0b1f3a] transition-colors font-mono" />
                    </div>
                  </div>
                </div>
                <div className="border border-[#e8edf3] p-3 bg-[#f8fafc] mt-3">
                  <p className="text-[10px] text-[#9ab0c4] uppercase tracking-widest mb-2">Preview</p>
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-1.5 text-white text-[12px] font-600 uppercase tracking-wide" style={{ backgroundColor: branding.primaryColor || '#0b1f3a' }}>Primary</div>
                    <div className="px-4 py-1.5 text-white text-[12px] font-600 uppercase tracking-wide" style={{ backgroundColor: branding.accentColor || '#1a6b3c' }}>Accent</div>
                    <span className="text-[12px] font-600" style={{ color: branding.accentColor || '#1a6b3c' }}>Link text</span>
                  </div>
                </div>
              </div>

              <button
                onClick={saveBranding}
                className="flex items-center gap-2 px-6 py-3 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[12px] font-600 uppercase tracking-wide transition-colors"
              >
                <Save size={14} /> Save Settings
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ─── ADD/EDIT MODAL (unchanged) ───────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveProduct} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Product Name *</label>
                <Input required placeholder="e.g., EPX+ 20kVA" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                <Input placeholder="Brief description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Category *</label>
                <select required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Specifications</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white font-mono text-sm" rows={4} placeholder="Capacity: 20kVA&#10;Efficiency: Up to 96.8%" value={formData.specs} onChange={e => setFormData({ ...formData, specs: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">One spec per line: <span className="font-mono">key: value</span></p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Images (comma separated URLs)</label>
                <Input placeholder="https://cloudinary.com/img1.jpg, https://cloudinary.com/img2.jpg" value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-[#1e3a5f] hover:bg-[#16293f] text-white" disabled={submitting}>
                  {submitting ? <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</span> : (editingProduct ? 'Update Product' : 'Add Product')}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon import for ChevronRightIcon used in sidebar
function ChevronRightIcon(props: any) {
  return <ChevronRight size={props.size || 10} className="ml-auto text-[#1a6b3c]" />;
}