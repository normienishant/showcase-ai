// app/page.tsx — Hero Restored, Search in Hero, Throttled Dropdown Position
'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, MessageCircle, Trash2, Download, Eye,
  XCircle, ArrowUp, Menu, X, Zap, Lightbulb
} from 'lucide-react';
import { api } from '@/lib/api';
import { useWishlist } from '@/store/wishlist';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { CatalogPDF } from '@/components/PDFCatalog';
import { extractIntent, getMatchingSeries } from '@/lib/searchTags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 bg-slate-100 rounded w-16" />
          <div className="h-5 bg-slate-100 rounded w-16" />
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <div className="h-9 bg-slate-100 rounded-lg flex-1" />
          <div className="h-9 w-9 bg-slate-100 rounded-lg" />
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
  const [searchMode, setSearchMode] = useState<'product' | 'ai'>('product');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModeSwitchHint, setShowModeSwitchHint] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const wishlist = useWishlist();

  // Load data from backend (only once)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let companyData;
        try {
          companyData = await api.getCompany('bpe');
        } catch (e) {
          console.error('Company fetch failed:', e);
          toast.error('Failed to load company data');
          setLoading(false);
          return;
        }
        setCompany(companyData);

        let cats: any[] = [];
        try {
          cats = await api.getCategories(companyData.id);
        } catch (e) {
          console.error('Categories fetch failed:', e);
          toast.error('Failed to load categories');
        }
        setCategories(cats);

        let prods: any[] = [];
        try {
          prods = await api.getProducts(companyData.id);
        } catch (e) {
          console.error('Products fetch failed:', e);
          toast.error('Failed to load products');
        }
        if (!Array.isArray(prods)) prods = [];
        setAllProducts(prods);
        setProducts(prods);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Failed to load catalog');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // === THROTTLED DROPDOWN POSITIONING (viewport-relative) ===
  useEffect(() => {
    if (!showDropdown || !searchInputRef) return;

    let frameId: number | null = null;
    let throttleTimer: NodeJS.Timeout | null = null;

    const updatePosition = () => {
      if (!searchInputRef) return;
      const rect = searchInputRef.getBoundingClientRect();

      // Hide if input is completely out of view
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setShowDropdown(false);
        return;
      }

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 320; // max-h-80

      let top = rect.bottom + 8;
      // Flip upward if not enough space below
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 8;
      }

      setDropdownPosition({
        top,
        left: rect.left,
        width: rect.width,
      });
    };

    const rafUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePosition);
    };

    // Throttled version: at most once every 100ms
    const throttledRafUpdate = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        rafUpdate();
      }, 100);
    };

    rafUpdate();
    window.addEventListener('scroll', throttledRafUpdate, { passive: true });
    window.addEventListener('resize', throttledRafUpdate, { passive: true });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (throttleTimer) clearTimeout(throttleTimer);
      window.removeEventListener('scroll', throttledRafUpdate);
      window.removeEventListener('resize', throttledRafUpdate);
    };
  }, [showDropdown, searchInputRef, search]);

  // Helper: get category IDs (including children)
  const getCategoryIds = (catId: string): string[] => {
    const result = [catId];
    const childIds = categories
      .filter(c => c.parentId === catId)
      .map(c => c.id);
    return [...result, ...childIds];
  };

  // Detect if query looks like natural language (for mode switch hint)
  const looksLikeNaturalLanguage = (query: string): boolean => {
    const lower = query.toLowerCase();
    const patterns = ['for', 'to', 'need', 'looking for', 'want', 'need a', 'have', 'with', 'without', '?'];
    const isLongQuery = query.split(' ').length > 3;
    const hasPattern = patterns.some(p => lower.includes(p));
    return isLongQuery || hasPattern;
  };

  // === Main filter for product grid ===
  const filterProducts = () => {
    let filtered = allProducts;

    if (search.trim()) {
      const s = search.toLowerCase();

      if (searchMode === 'product') {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          Object.values(p.specs || {}).some(v =>
            String(v).toLowerCase().includes(s)
          )
        );
        if (filtered.length === 0 && looksLikeNaturalLanguage(search)) {
          setShowModeSwitchHint(true);
        } else {
          setShowModeSwitchHint(false);
        }
      } else {
        const intents = extractIntent(search);
        const matchingSeries = getMatchingSeries(intents);
        const isAISearch = intents.length > 0;

        const nameMatch = allProducts.filter(p =>
          p.name.toLowerCase().startsWith(s)
        );
        const containsMatch = allProducts.filter(p =>
          p.name.toLowerCase().includes(s) && !p.name.toLowerCase().startsWith(s)
        );
        const descMatch = allProducts.filter(p =>
          (p.description?.toLowerCase().includes(s) ||
          Object.values(p.specs || {}).some(v =>
            String(v).toLowerCase().includes(s)
          )) &&
          !p.name.toLowerCase().includes(s)
        );

        let intentMatch: any[] = [];
        if (isAISearch) {
          const matchedProducts = allProducts.filter(p => {
            const productName = p.name.toLowerCase();
            const category = categories.find(c => c.id === p.categoryId);
            const categoryName = category?.name?.toLowerCase() || '';
            for (const series of matchingSeries) {
              if (productName.includes(series.toLowerCase()) ||
                  categoryName.includes(series.toLowerCase())) {
                return true;
              }
            }
            return false;
          });
          const existingIds = new Set([
            ...nameMatch,
            ...containsMatch,
            ...descMatch,
          ].map(p => p.id));
          intentMatch = matchedProducts.filter(p => !existingIds.has(p.id));
        }

        let combined = [...nameMatch, ...containsMatch, ...descMatch, ...intentMatch];
        const unique = combined.filter((p, index, self) =>
          index === self.findIndex((t) => t.id === p.id)
        );

        const scored = unique.map(p => {
          let score = 0;
          const nameLower = p.name.toLowerCase();
          if (nameLower.startsWith(s)) score += 100;
          else if (nameLower.includes(s)) score += 50;
          if (isAISearch) {
            for (const series of matchingSeries) {
              if (nameLower.includes(series.toLowerCase())) {
                score += 30;
                break;
              }
            }
          }
          return { ...p, score };
        });
        scored.sort((a, b) => b.score - a.score);
        filtered = scored;
        setShowModeSwitchHint(false);
      }
    } else {
      filtered = allProducts;
      setShowModeSwitchHint(false);
    }

    if (selectedCategory) {
      const allowedIds = getCategoryIds(selectedCategory);
      filtered = filtered.filter(p =>
        allowedIds.includes(p.categoryId)
      );
    }

    setProducts(filtered);
  };

  // Run filter whenever search, mode, category, or products change
  useEffect(() => {
    filterProducts();
  }, [search, searchMode, selectedCategory, allProducts, categories]);

  // Handle search input change with dropdown
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setShowModeSwitchHint(false);

    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    let results: any[] = [];

    if (searchMode === 'product') {
      const s = value.toLowerCase();
      results = allProducts.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        Object.values(p.specs || {}).some(v =>
          String(v).toLowerCase().includes(s)
        )
      );
      results = results.map(p => {
        const nameLower = p.name.toLowerCase();
        let score = 0;
        if (nameLower.startsWith(s)) score = 100;
        else if (nameLower.includes(s)) score = 50;
        return { ...p, score };
      });
      results.sort((a, b) => b.score - a.score);
    } else {
      const s = value.toLowerCase();
      const intents = extractIntent(value);
      const matchingSeries = getMatchingSeries(intents);
      const isAISearch = intents.length > 0;

      const nameMatch = allProducts.filter(p => p.name.toLowerCase().startsWith(s));
      const containsMatch = allProducts.filter(p =>
        p.name.toLowerCase().includes(s) && !p.name.toLowerCase().startsWith(s)
      );
      const descMatch = allProducts.filter(p =>
        (p.description?.toLowerCase().includes(s) ||
        Object.values(p.specs || {}).some(v =>
          String(v).toLowerCase().includes(s)
        )) &&
        !p.name.toLowerCase().includes(s)
      );

      let intentMatch: any[] = [];
      if (isAISearch) {
        const matchedProducts = allProducts.filter(p => {
          const productName = p.name.toLowerCase();
          const category = categories.find(c => c.id === p.categoryId);
          const categoryName = category?.name?.toLowerCase() || '';
          for (const series of matchingSeries) {
            if (productName.includes(series.toLowerCase()) ||
                categoryName.includes(series.toLowerCase())) {
              return true;
            }
          }
          return false;
        });
        const existingIds = new Set([
          ...nameMatch,
          ...containsMatch,
          ...descMatch,
        ].map(p => p.id));
        intentMatch = matchedProducts.filter(p => !existingIds.has(p.id));
      }

      let combined = [...nameMatch, ...containsMatch, ...descMatch, ...intentMatch];
      const unique = combined.filter((p, index, self) =>
        index === self.findIndex((t) => t.id === p.id)
      );
      const scored = unique.map(p => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        if (nameLower.startsWith(s)) score = 100;
        else if (nameLower.includes(s)) score = 50;
        if (isAISearch) {
          for (const series of matchingSeries) {
            if (nameLower.includes(series.toLowerCase())) {
              score += 30;
              break;
            }
          }
        }
        return { ...p, score };
      });
      scored.sort((a, b) => b.score - a.score);
      results = scored;
    }

    setSearchResults(results.slice(0, 8));
    setShowDropdown(true);
  };

  // Switch to AI mode
  const switchToAIMode = () => {
    setSearchMode('ai');
    setShowModeSwitchHint(false);
    setTimeout(() => filterProducts(), 100);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitLead(company.id, { ...leadForm, wishlist_snapshot: wishlist.items });
      toast.success("Inquiry sent. We'll contact you soon.");
      setShowLeadModal(false);
      setLeadForm({ name: '', email: '', phone: '', message: '' });
      wishlist.clear();
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }
  if (!company) return <div>Company not found</div>;

  const isWishlistEmpty = wishlist.items.length === 0;
  const topLevelCategories = categories.filter(c => c.parentId === null);

  const whatsappMessage = encodeURIComponent(
    `Hello BPE Team,\nI'm interested in these products:\n${wishlist.items.map(p => `- ${p.name}`).join('\n')}\n\nPlease contact me.`
  );

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-display font-bold text-slate-900 tracking-tight">
                  {company.name}
                </h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Product catalog
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:scale-[1.02] rounded-lg transition-all duration-200 border border-slate-100">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Wishlist</span>
                    {!isWishlistEmpty && (
                      <span className="absolute -top-2 -right-2 bg-[#1e3a5f] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlist.items.length}
                      </span>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl p-6 shadow-2xl border-0">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-display font-bold text-slate-900">
                      Your wishlist
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-96 overflow-y-auto pr-1">
                    {isWishlistEmpty ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Heart className="h-12 w-12 mb-3 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-500">Your wishlist is empty</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Start shortlisting products you need
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {wishlist.items.map(item => (
                          <li
                            key={item.id}
                            className="flex justify-between items-center bg-slate-50 rounded-lg p-3 border border-slate-100"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {Object.values(item.specs || {}).slice(0, 2).join(' · ')}
                              </p>
                            </div>
                            <button
                              className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              onClick={() => wishlist.removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {!isWishlistEmpty && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                        <PDFDownloadLink
                          document={<CatalogPDF company={company} products={wishlist.items} />}
                          fileName="bpe-catalog.pdf"
                        >
                          {({ loading }) => (
                            <button
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#16293f] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                              disabled={loading}
                            >
                              <Download className="h-4 w-4" />
                              {loading ? 'Generating...' : 'Download PDF'}
                            </button>
                          )}
                        </PDFDownloadLink>
                        <a
                          href={`https://wa.me/${company.whatsappNumber}?text=${whatsappMessage}`}
                          target="_blank"
                          className="flex-1"
                        >
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                          </button>
                        </a>
                      </div>
                      <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                        onClick={() => setShowLeadModal(true)}
                      >
                        Submit inquiry
                      </button>
                      <button
                        className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                        onClick={() => wishlist.clear()}
                      >
                        Clear wishlist
                      </button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <button
                className="md:hidden text-slate-500 hover:text-slate-700 transition-colors p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-slate-50" />
        <div
          className="absolute inset-0 opacity-[0.9]"
          style={{
            backgroundImage: 'radial-gradient(#1e3a5f 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white border border-slate-100 px-3.5 py-1.5 rounded-full mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-500 tracking-wide">
              Live interactive catalog
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1]"
          >
            Flexible power,<br />
            <span className="text-[#1e3a5f]">reliable solutions</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            Search the full UPS, BESS and data-center range. Shortlist, compare,
            and send an inquiry in one place.
          </motion.p>

          {/* ===== MODE TOGGLE + SEARCH INPUT ===== */}
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setSearchMode('product')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                searchMode === 'product'
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔍 Product Search
            </button>
            <button
              onClick={() => setSearchMode('ai')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                searchMode === 'ai'
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✨ AI Search
            </button>
          </div>

          <div className="mt-4 max-w-xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              ref={(el) => setSearchInputRef(el)}
              type="text"
              placeholder={
                searchMode === 'product'
                  ? "Search by model, kVA rating, or category..."
                  : "Describe your power needs (e.g., UPS for 20 computers)..."
              }
              className="w-full pl-14 pr-12 py-4 text-base bg-white border border-slate-200 focus:border-slate-300 rounded-2xl shadow-lg shadow-slate-200/30 outline-none transition-colors"
              value={search}
              onChange={handleSearchChange}
              onFocus={() => {
                if (search.trim().length > 0 && searchResults.length > 0) {
                  setShowDropdown(true);
                }
              }}
            />
            {search && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => {
                  setSearch('');
                  setSearchResults([]);
                  setShowDropdown(false);
                  setShowModeSwitchHint(false);
                }}
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* AI Search Hint */}
          {searchMode === 'ai' && (
            <p className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Try: "office UPS for 10 computers" or "solar battery storage"
            </p>
          )}

          {/* Mode Switch Hint */}
          {showModeSwitchHint && searchMode === 'product' && search.trim() && (
            <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>
                It looks like you're describing a need.
                <button
                  onClick={switchToAIMode}
                  className="ml-1.5 font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                >
                  Try AI Search →
                </button>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ===== SEARCH DROPDOWN ===== */}
      {showDropdown && searchResults.length > 0 && (
        <div
          className="fixed z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto will-change-transform"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width || 'auto',
            minWidth: '300px',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {searchResults.map((product) => {
            const category = categories.find(c => c.id === product.categoryId);
            const imageUrl = (product.images && product.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';
            const isNameMatch = product.name.toLowerCase().startsWith(search.toLowerCase());
            const isAIMatch = searchMode === 'ai' && !isNameMatch && (product.score || 0) > 20;

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                  isNameMatch ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => {
                  setShowDropdown(false);
                  setSearch(product.name);
                }}
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg bg-slate-50"
                />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {product.name}
                    {isNameMatch && (
                      <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Best match</span>
                    )}
                    {isAIMatch && (
                      <span className="ml-2 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">AI match</span>
                    )}
                    {searchMode === 'product' && !isNameMatch && (
                      <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Product</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{product.description}</p>
                </div>
                {category && (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                    {category.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {showDropdown && search.trim().length > 0 && searchResults.length === 0 && (
        <div
          className="fixed z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-center text-sm text-slate-400"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width || 'auto',
            minWidth: '300px',
          }}
        >
          {searchMode === 'product'
            ? `No exact product found for "${search}". Try describing your need with AI Search`
            : `No products found for "${search}". Try different keywords.`}
        </div>
      )}

      {/* ===== CATEGORY TABS ===== */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 hover:scale-[1.02] ${
                !selectedCategory
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All <span className="ml-1.5 text-xs text-blue-200">({allProducts.length})</span>
            </button>
            {topLevelCategories.map((cat) => {
              const totalCount = getTotalParentProductCount(cat.id);
              if (totalCount === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 hover:scale-[1.02] ${
                    selectedCategory === cat.id
                      ? 'bg-[#1e3a5f] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                  <span
                    className={`ml-1.5 text-xs ${
                      selectedCategory === cat.id ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {totalCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== PRODUCT GRID ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Search className="h-12 w-12 mb-4 stroke-1" />
            <p className="text-lg font-medium text-slate-600">
              {search.trim() ? 'No products found' : 'Start searching to find products'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {search.trim()
                ? searchMode === 'product'
                  ? 'Try describing your need with ✨ AI Search instead'
                  : 'Try different keywords or switch to Product Search'
                : 'Use the search bar above to explore our catalog'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-5">
              <span className="font-medium text-slate-700">{products.length}</span> products
              {selectedCategory && <span className="ml-1">in this category</span>}
              {searchMode === 'ai' && search.trim() && (
                <span className="ml-2 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-xs">AI search</span>
              )}
            </p>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.03 },
                },
              }}
            >
              {products.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const isInWishlist = wishlist.isInWishlist(product.id);
                const specs = Object.entries(product.specs || {}).slice(0, 2);
                const extraSpecs = Object.keys(product.specs || {}).length - 2;
                const imageUrl = (product.images && product.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';

                return (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="relative aspect-square bg-slate-50 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                        />
                        {category && (
                          <span className="absolute top-3 left-3 text-[10px] font-medium text-slate-600 bg-white/95 px-2 py-1 rounded-md border border-slate-200">
                            {category.name}
                          </span>
                        )}
                        {product.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-semibold text-white bg-[#1e3a5f] px-2 py-1 rounded-md">
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/product/${product.id}`} className="block">
                        <h3 className="font-semibold text-[15px] text-slate-900 line-clamp-1 group-hover:text-[#1e3a5f] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-[13px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description || ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {specs.map(([key, val]) => (
                          <span
                            key={key}
                            className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border-l-2 border-[#1e3a5f]"
                          >
                            {val as string}
                          </span>
                        ))}
                        {extraSpecs > 0 && (
                          <span className="text-[11px] text-slate-400 px-2 py-0.5">
                            +{extraSpecs} more
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                            isInWishlist
                              ? 'bg-[#1e3a5f] text-white'
                              : 'text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
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
                          <Heart
                            className="h-3.5 w-3.5"
                            fill={isInWishlist ? 'white' : 'none'}
                          />
                          {isInWishlist ? 'Added' : 'Shortlist'}
                        </button>
                        <button
                          className="flex items-center justify-center px-3 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="h-3.5 w-3.5" />
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

      {/* ===== QUICK VIEW MODAL ===== */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-slate-900">
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                <img
                  src={(selectedProduct.images && selectedProduct.images[0]) || 'https://placehold.co/600x600/1a56db/white?text=No+Image'}
                  alt={selectedProduct.name}
                  className="w-full aspect-square object-cover"
                />
              </div>
              <div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {selectedProduct.description || ''}
                </p>
                <h4 className="font-semibold mt-4 text-xs text-slate-400 uppercase tracking-wider">
                  Specifications
                </h4>
                <div className="mt-2 space-y-1 max-h-52 overflow-y-auto pr-1">
                  {Object.entries(selectedProduct.specs || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between text-sm border-b border-slate-100 py-1.5"
                    >
                      <span className="text-slate-400 text-xs">{key}</span>
                      <span className="font-medium text-slate-700 text-xs">
                        {val as string}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#16293f] rounded-lg transition-colors shadow-sm hover:scale-[1.02] duration-200"
                    onClick={() => {
                      wishlist.addItem(selectedProduct);
                      toast.success(`Added ${selectedProduct.name}`);
                      setSelectedProduct(null);
                    }}
                  >
                    <Heart className="h-4 w-4" /> Add to wishlist
                  </button>
                  <a
                    href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(`Hi, I need details for ${selectedProduct.name}`)}`}
                    target="_blank"
                  >
                    <button className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg transition-colors hover:bg-slate-50">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== LEAD CAPTURE MODAL ===== */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-slate-900">
              Submit inquiry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLead} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Full name *
              </label>
              <input
                required
                placeholder="Your full name"
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Phone *
              </label>
              <input
                required
                placeholder="+91 9999999999"
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Message
              </label>
              <input
                placeholder="Any specific requirements?"
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 transition-colors"
                value={leadForm.message}
                onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
              />
            </div>
            {wishlist.items.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500">Selected products</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {wishlist.items.map((p) => p.name).join(', ')}
                </p>
              </div>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#16293f] rounded-lg transition-colors shadow-sm hover:scale-[1.01] duration-200"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit inquiry'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-display font-bold mb-3">{company.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Flexible power, reliable solutions — since 1995.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="hover:text-white transition-colors"
                  >
                    About us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="hover:text-white transition-colors"
                  >
                    Help center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="hover:text-white transition-colors"
                  >
                    Privacy policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <p className="text-sm text-slate-400">WhatsApp: {company.whatsappNumber}</p>
              <p className="text-sm text-slate-400 mt-1">Toll free: 1800 103 1247</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
            © 2026 {company.name}. All rights reserved. Powered by Showcase AI
          </div>
        </div>
      </footer>

      {/* ===== BACK TO TOP ===== */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 bg-[#1e3a5f] hover:bg-[#16293f] text-white p-3 rounded-full shadow-lg transition-colors"
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