// app/page.tsx — Modern Redesign with Animations
'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, MessageCircle, Trash2, Download, Eye, Sparkles, XCircle, ArrowUp, Menu, X, ChevronRight } from 'lucide-react';
import { mockApi } from '@/lib/mockApi';
import { useWishlist } from '@/store/wishlist';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { CatalogPDF } from '@/components/PDFCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

// Skeleton Loader with shimmer
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <div className="h-9 bg-gray-200 rounded-lg flex-1" />
          <div className="h-9 w-9 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function CatalogContent() {
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const wishlist = useWishlist();

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const companyData = await mockApi.getCompany('bpe');
        setCompany(companyData);
        const cats = await mockApi.getCategories(companyData.id);
        setCategories(cats);
        const prods = await mockApi.getProducts(companyData.id);
        const enhanced = prods.map((p, i) => ({
          ...p,
          badge: i % 3 === 0 ? 'New' : i % 5 === 0 ? 'Popular' : undefined,
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        }));
        setAllProducts(enhanced);
        setProducts(enhanced);
      } catch (error) {
        console.error('Failed to load data', error);
        toast.error('Failed to load catalog');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Search & Filter
  useEffect(() => {
    if (!company) return;
    const fetchFiltered = async () => {
      const filtered = await mockApi.getProducts(company.id, {
        search: search,
        categoryId: selectedCategory || undefined,
      });
      const enhanced = filtered.map((p) => {
        const original = allProducts.find(a => a.id === p.id);
        return { ...p, badge: original?.badge, createdAt: original?.createdAt };
      });
      setProducts(enhanced);
    };
    fetchFiltered();
  }, [search, selectedCategory, company]);

  // Sorting
  useEffect(() => {
    if (!products.length) return;
    const sorted = [...products];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sortOrder === 'desc') sorted.reverse();
    setProducts(sorted);
  }, [sortBy, sortOrder]);

  // Lead submission
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mockApi.submitLead({ ...leadForm, wishlist: wishlist.items });
      toast.success('Inquiry sent! We\'ll contact you soon.');
      setShowLeadModal(false);
      setLeadForm({ name: '', email: '', phone: '', message: '' });
      wishlist.clear();
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Back to top
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Counts
  const getTotalProductCount = (categoryId: string) => {
    return allProducts.filter(p => p.categoryId === categoryId).length;
  };

  const getTotalParentProductCount = (parentId: string) => {
    const directCount = allProducts.filter(p => p.categoryId === parentId).length;
    const subcategories = categories.filter(c => c.parentId === parentId);
    const subCount = subcategories.reduce((sum, sub) => sum + getTotalProductCount(sub.id), 0);
    return directCount + subCount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }
  if (!company) return <div>Company not found</div>;

  const primary = company.primaryColor;
  const isWishlistEmpty = wishlist.items.length === 0;

  const topLevelCategories = categories.filter(c => c.parentId === null);

  const whatsappMessage = encodeURIComponent(
    `Hello BPE Team,\nI'm interested in these products:\n${wishlist.items.map(p => `- ${p.name}`).join('\n')}\n\nPlease contact me.`
  );

  return (
    <div className="min-h-screen bg-white font-sans antialiased scroll-smooth">
      {/* HEADER — Glassmorphism */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {company.logoUrl && (
                <img src={company.logoUrl} alt={company.name} className="h-10 w-auto" />
              )}
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-gray-900">{company.name}</h1>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Product Catalog</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Wishlist Trigger */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all duration-200 border border-gray-200/50">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Wishlist</span>
                    {!isWishlistEmpty && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                        {wishlist.items.length}
                      </span>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">Your Wishlist</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto pr-2">
                    {isWishlistEmpty ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Heart className="h-14 w-14 mb-4 stroke-[1.5]" />
                        <p className="text-sm font-medium text-gray-500">Your wishlist is empty</p>
                        <p className="text-xs text-gray-400 mt-1">Start adding products you like</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {wishlist.items.map(item => (
                          <li key={item.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400 truncate">{Object.values(item.specs).slice(0, 2).join(' · ')}</p>
                            </div>
                            <button className="text-gray-300 hover:text-red-500 transition-colors p-1" onClick={() => wishlist.removeItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {!isWishlistEmpty && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-2">
                        <PDFDownloadLink document={<CatalogPDF company={company} products={wishlist.items} />} fileName="bpe-catalog.pdf">
                          {({ loading }) => (
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm" disabled={loading}>
                              <Download className="h-4 w-4" /> {loading ? 'Generating...' : 'Download PDF'}
                            </button>
                          )}
                        </PDFDownloadLink>
                        <a href={`https://wa.me/${company.whatsappNumber}?text=${whatsappMessage}`} target="_blank" className="flex-1">
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm">
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                          </button>
                        </a>
                      </div>
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm" onClick={() => setShowLeadModal(true)}>
                        Submit Inquiry
                      </button>
                      <button className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors" onClick={() => wishlist.clear()}>
                        Clear Wishlist
                      </button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* HERO — Dots intact, text readable */}
<section className="relative py-16 px-4 overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 border-b border-gray-100/60">
  
  {/* Dotted background — unchanged */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="absolute inset-0 opacity-20 bg-[radial-gradient(#1a56db_1px,transparent_1px)] [background-size:20px_20px]"
  />
  
  {/* Soft overlay for readability — does NOT remove dots */}
  <div className="absolute inset-0 bg-white/30 z-0" />

  <div className="relative z-10 max-w-5xl mx-auto text-center">
    {/* Tagline, heading, description, search — all now sit above the overlay */}
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-200/60 shadow-sm mb-6"
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-[11px] font-medium text-gray-500 tracking-wide">Interactive Product Experience</span>
    </motion.div>
    
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-tight drop-shadow-sm"
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Flexible Power,</span>
      <br />
      <span className="text-gray-800">Reliable Solutions</span>
    </motion.h1>
    
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed drop-shadow-sm"
    >
      Discover, shortlist, and inquire — all in one seamless experience.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="mt-8 max-w-2xl mx-auto relative"
    >
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Search for products by name, specification, or category..."
        className="w-full pl-14 pr-12 py-4 text-base bg-white/90 backdrop-blur-sm border border-gray-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 rounded-2xl shadow-lg transition-all outline-none"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setSearch('')}
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  </div>
</section>

   {/* CATEGORY TABS + SORT — Clean, No Tooltips */}
<div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100/60">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all relative ${
            !selectedCategory 
              ? 'text-blue-600' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          All
          {!selectedCategory && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        {topLevelCategories.map(cat => {
          const totalCount = getTotalParentProductCount(cat.id);
          if (totalCount === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all relative ${
                selectedCategory === cat.id 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {cat.name}
              <span className="ml-1.5 text-xs font-normal opacity-70">({totalCount})</span>
              {selectedCategory === cat.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by as 'name' | 'newest');
            setSortOrder(order as 'asc' | 'desc');
          }}
        >
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="newest-desc">Newest First</option>
          <option value="newest-asc">Oldest First</option>
        </select>
        {selectedCategory && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            onClick={() => setSelectedCategory(null)}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  </div>
</div>

      {/* PRODUCT GRID — with stagger animations */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <Search className="h-16 w-16 mb-4 stroke-1" />
            <p className="text-xl font-medium text-gray-500">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-400">
                <span className="font-medium text-gray-600">{products.length}</span> products
                {selectedCategory && <span className="ml-1">· filtered</span>}
              </p>
            </div>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {products.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                const isInWishlist = wishlist.isInWishlist(product.id);
                const specs = Object.entries(product.specs).slice(0, 2);
                const extraSpecs = Object.keys(product.specs).length - 2;

                return (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="group bg-white rounded-2xl border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="relative aspect-square bg-gray-50 overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        {category && (
                          <span className="absolute top-3 left-3 text-[10px] font-medium text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            {category.name}
                          </span>
                        )}
                        {product.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-medium text-white bg-amber-500/90 px-2.5 py-1 rounded-full shadow-sm">
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/product/${product.id}`} className="block">
                        <h3 className="font-semibold text-base text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {specs.map(([key, val]) => (
                          <span key={key} className="text-[11px] font-medium text-gray-500 bg-gray-100/80 px-2.5 py-0.5 rounded-full">
                            {val as string}
                          </span>
                        ))}
                        {extraSpecs > 0 && (
                          <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full">
                            +{extraSpecs}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100/80">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            isInWishlist 
                              ? 'text-white shadow-sm' 
                              : 'text-gray-600 border border-gray-200/80 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: isInWishlist ? primary : undefined,
                            borderColor: isInWishlist ? primary : undefined,
                          }}
                          onClick={() => {
                            if (isInWishlist) {
                              wishlist.removeItem(product.id);
                              toast.info(`Removed ${product.name}`);
                            } else {
                              wishlist.addItem(product);
                              toast.success(`Added ${product.name}`);
                            }
                          }}
                        >
                          <Heart className="h-4 w-4" fill={isInWishlist ? "white" : "none"} />
                          {isInWishlist ? 'Added' : 'Shortlist'}
                        </motion.button>
                        <button
                          className="flex items-center justify-center px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-200/60"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </main>

      {/* QUICK VIEW MODAL */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl overflow-hidden relative">
                <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-64 object-cover" />
                {selectedProduct.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium text-white bg-amber-500/90 px-2.5 py-1 rounded-full shadow-sm">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 leading-relaxed">{selectedProduct.description}</p>
                <h4 className="font-semibold mt-4 text-xs text-gray-400 uppercase tracking-wider">Specifications</h4>
                <div className="mt-2 space-y-1 max-h-52 overflow-y-auto pr-1">
                  {Object.entries(selectedProduct.specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm border-b border-gray-100/80 py-1.5">
                      <span className="text-gray-400 text-xs">{key}</span>
                      <span className="font-medium text-gray-700 text-xs">{val as string}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all shadow-sm"
                    style={{ backgroundColor: primary }}
                    onClick={() => {
                      wishlist.addItem(selectedProduct);
                      toast.success(`Added ${selectedProduct.name}`);
                      setSelectedProduct(null);
                    }}
                  >
                    <Heart className="h-4 w-4" /> Add to Wishlist
                  </button>
                  <a
                    href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(
                      `Hi, I need details for ${selectedProduct.name}`
                    )}`}
                    target="_blank"
                  >
                    <button className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200/80 rounded-xl transition-all hover:bg-gray-50">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LEAD CAPTURE MODAL */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Submit Inquiry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLead} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name *</label>
              <input
                required
                placeholder="Your full name"
                className="w-full px-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/40 transition-all"
                value={leadForm.name}
                onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email *</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/40 transition-all"
                value={leadForm.email}
                onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone *</label>
              <input
                required
                placeholder="+91 9999999999"
                className="w-full px-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/40 transition-all"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Message</label>
              <input
                placeholder="Any specific requirements?"
                className="w-full px-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/40 transition-all"
                value={leadForm.message}
                onChange={(e) => setLeadForm({...leadForm, message: e.target.value})}
              />
            </div>
            {wishlist.items.length > 0 && (
              <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500">Selected Products</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{wishlist.items.map(p => p.name).join(', ')}</p>
              </div>
            )}
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all shadow-sm" style={{ backgroundColor: primary }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">{company.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Flexible Power, Reliable Solutions — since 1995.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">YouTube</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <p className="text-sm text-gray-400">WhatsApp: {company.whatsappNumber}</p>
              <p className="text-sm text-gray-400 mt-1">Email: info@bpe.com</p>
              <p className="text-sm text-gray-400 mt-1">Toll Free: 1800 103 1247</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            <p>© 2025 {company.name}. All rights reserved. Powered by <span className="text-blue-400">Showcase AI</span></p>
          </div>
        </div>
      </footer>

      {/* BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-all duration-200"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white">Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}