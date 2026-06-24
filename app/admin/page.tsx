// app/admin/page.tsx — Real Data + Authentication (HOOKS ORDER FIXED)
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, FolderTree, Users, Settings, LogOut,
  Search, Plus, Edit, Trash2, Eye, Download, TrendingUp, Clock,
  Bell, User
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();

  // ========== ALL HOOKS MUST BE AT THE TOP ==========
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'leads' | 'branding'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Branding state (MOVED UP — before any conditional return)
  const [branding, setBranding] = useState({
    logoUrl: 'https://placehold.co/200x80/1a56db/white?text=BPE',
    primaryColor: '#1a56db',
    whatsappNumber: '+919311995859',
    websiteUrl: 'https://www.bpe.com',
  });

  // ========== ALL useEffects AT THE TOP ==========
  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return;

    // In the loadData function inside useEffect
const loadData = async () => {
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
  } catch (error: any) {
    console.error('Failed to load admin data:', error);
    // If 401, already handled by adminFetch (redirects to login)
    // But if not handled, show toast
    if (error?.status !== 401) {
      toast.error('Failed to load dashboard data');
    }
  } finally {
    setLoading(false);
  }
};

    loadData();
  }, [isAuthenticated]);

  // Load branding from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bpe-branding');
    if (saved) {
      try {
        setBranding(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse branding:', e);
      }
    }
  }, []);

  // ========== FUNCTIONS ==========
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
    toast.info('Logged out');
  };

  const saveBranding = () => {
    localStorage.setItem('bpe-branding', JSON.stringify(branding));
    toast.success('Branding settings saved!');
  };

  // ========== CONDITIONAL RENDER (AFTER ALL HOOKS) ==========
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

  const statusColors = {
    new: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
    contacted: 'bg-green-100 text-green-700 border-green-200',
  };

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'blue' },
    { label: 'Categories', value: categories.length, icon: FolderTree, color: 'green' },
    { label: 'Leads', value: leads.length, icon: Users, color: 'yellow' },
    { label: 'Conversion Rate', value: leads.length > 0 ? `${Math.round((leads.length / (leads.length + 10)) * 100)}%` : '0%', icon: TrendingUp, color: 'purple' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'branding', label: 'Branding', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-[280px] bg-gray-900 text-gray-300 h-screen sticky top-0 flex flex-col shadow-2xl border-r border-gray-800/60"
      >
        <div className="p-6 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">Showcase AI</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-11">Admin Panel v1.0</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : ''}`} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 capitalize">{activeTab}</h2>
            <p className="text-sm text-gray-400">Manage your catalog and leads</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">A</div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  const colorMap = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-200',
                    green: 'bg-green-50 text-green-600 border-green-200',
                    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
                    purple: 'bg-purple-50 text-purple-600 border-purple-200',
                  };
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${colorMap[stat.color as keyof typeof colorMap]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-sm text-gray-400">{stat.label}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" /> Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {leads.slice(0, 3).map((lead, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">New lead from {lead.name}</p>
                          <p className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge className={statusColors[lead.status as keyof typeof statusColors] || 'bg-gray-100'}>
                          {lead.status}
                        </Badge>
                      </div>
                    ))}
                    {leads.length === 0 && <p className="text-sm text-gray-400">No leads yet.</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search products..." className="pl-9 h-10 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{products.length} products</span>
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Category</th>
                      <th className="px-5 py-3 text-left font-medium">Specs</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.slice(0, 8).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{p.name}</td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {categories.find(c => c.id === p.categoryId)?.name || 'Uncategorized'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {Object.keys(p.specs || {}).slice(0, 2).join(', ')}
                          {Object.keys(p.specs || {}).length > 2 && ` +${Object.keys(p.specs || {}).length - 2}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className="bg-green-100 text-green-700 border-green-200">Visible</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-400">Showing {Math.min(8, products.length)} of {products.length}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Category Tree</h3>
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Category</Button>
              </div>
              <ul className="space-y-2">
                {categories.filter(c => c.parentId === null).map(cat => (
                  <li key={cat.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center gap-3 py-2">
                      <FolderTree className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-800">{cat.name}</span>
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
            </motion.div>
          )}

          {/* Leads */}
          {activeTab === 'leads' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search leads..." className="pl-9 h-10 text-sm" />
                </div>
                <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Email</th>
                      <th className="px-5 py-3 text-left font-medium">Phone</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{lead.name}</td>
                        <td className="px-5 py-3.5 text-gray-500">{lead.email}</td>
                        <td className="px-5 py-3.5 text-gray-500">{lead.phone}</td>
                        <td className="px-5 py-3.5">
                          <Badge className={statusColors[lead.status as keyof typeof statusColors] || 'bg-gray-100'}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100"><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">No leads submitted yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-gray-800 text-lg">Branding Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Logo URL</label>
                  <Input value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Primary Color</label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input type="text" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="flex-1" />
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200" style={{ backgroundColor: branding.primaryColor }} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <Input value={branding.whatsappNumber} onChange={(e) => setBranding({ ...branding, whatsappNumber: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Website URL</label>
                  <Input value={branding.websiteUrl} onChange={(e) => setBranding({ ...branding, websiteUrl: e.target.value })} className="mt-1" />
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={saveBranding}>Save Changes</Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}