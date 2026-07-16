'use client';
import { useEffect, useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, MessageCircle, Trash2, Download, Eye,
  XCircle, ArrowUp, Menu, X, Zap, Lightbulb,
  ChevronRight, Phone, Mail, FileDown,
  CheckCircle, ArrowRight, MapPin, Home, Package, List, User
} from 'lucide-react';
import { api } from '@/lib/api';
import { useWishlist } from '@/store/wishlist';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { CatalogPDF } from '@/components/PDFCatalog';
import { extractIntent, getMatchingSeries } from '@/lib/searchTags';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AIAdvisor from '@/components/AIAdvisor';
import { trackSearch, trackWishlistAdd, trackWishlistRemove } from '@/lib/tracking';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

function ProductSkeleton() {
  return (
    <div className="bg-white border border-[#e8edf3] animate-pulse">
      <div className="aspect-[4/3] bg-[#eef1f5]" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-[#eef1f5] rounded w-3/4" />
        <div className="h-3 bg-[#eef1f5] rounded w-full" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 bg-[#eef1f5] rounded w-16" />
          <div className="h-5 bg-[#eef1f5] rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function CatalogContent() {
  // ─── STATE ──────────────────────────────────────────────────
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
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const wishlist = useWishlist();

  // ─── DEBOUNCE SEARCH ────────────────────────────────────────
  const debouncedSearch = useDebounce(search, 300);

  // ─── LOAD DATA WITH LOCALSTORAGE CACHE ─────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Check localStorage cache
      const cached = localStorage.getItem('bpe-products');
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setAllProducts(data);
            setProducts(data);
            setLoading(false);
            // Still fetch company and categories from cache if available
            const companyCached = localStorage.getItem('bpe-company');
            if (companyCached) {
              const { companyData } = JSON.parse(companyCached);
              setCompany(companyData);
              // Also fetch categories in background
              try {
                const cats = await api.getCategories(companyData.id);
                setCategories(cats);
                localStorage.setItem('bpe-categories', JSON.stringify({ data: cats, timestamp: Date.now() }));
              } catch {}
              return;
            }
          }
        } catch {}
      }

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
        localStorage.setItem('bpe-company', JSON.stringify({ companyData, timestamp: Date.now() }));

        let cats: any[] = [];
        try {
          cats = await api.getCategories(companyData.id);
        } catch (e) {
          console.error('Categories fetch failed:', e);
          toast.error('Failed to load categories');
        }
        setCategories(cats);
        localStorage.setItem('bpe-categories', JSON.stringify({ data: cats, timestamp: Date.now() }));

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
        localStorage.setItem('bpe-products', JSON.stringify({ data: prods, timestamp: Date.now() }));
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Failed to load catalog');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─── IMPROVED DROPDOWN POSITIONING ──────────────────────
  useEffect(() => {
    if (!showDropdown || !searchInputRef) return;

    const updatePosition = () => {
      if (!searchInputRef) return;
      const rect = searchInputRef.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const throttledUpdate = () => {
      if (scrollTimeout.current) return;
      scrollTimeout.current = setTimeout(() => {
        updatePosition();
        scrollTimeout.current = null;
      }, 100);
    };

    updatePosition();
    window.addEventListener('scroll', throttledUpdate, { passive: true });
    window.addEventListener('resize', throttledUpdate, { passive: true });

    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      window.removeEventListener('scroll', throttledUpdate);
      window.removeEventListener('resize', throttledUpdate);
    };
  }, [showDropdown, searchInputRef, search]);

  // ─── HELPERS ────────────────────────────────────────────────
  const getCategoryIds = (catId: string): string[] => {
    const result = [catId];
    const childIds = categories
      .filter(c => c.parentId === catId)
      .map(c => c.id);
    return [...result, ...childIds];
  };

  const looksLikeNaturalLanguage = (query: string): boolean => {
    const lower = query.toLowerCase();
    const patterns = ['for', 'to', 'need', 'looking for', 'want', 'need a', 'have', 'with', 'without', '?'];
    const isLongQuery = query.split(' ').length > 3;
    const hasPattern = patterns.some(p => lower.includes(p));
    return isLongQuery || hasPattern;
  };

  // ─── AI SEARCH HANDLER ──────────────────────────────────────
  const handleAISearch = (value: string) => {
    const intents = extractIntent(value);
    const matchingSeries = getMatchingSeries(intents);
    const isAISearch = intents.length > 0;

    if (!isAISearch) {
      const s = value.toLowerCase();
      const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        Object.values(p.specs || {}).some(v =>
          String(v).toLowerCase().includes(s)
        )
      );
      setSearchResults(results.slice(0, 8));
      setShowDropdown(results.length > 0);
      return;
    }

    const s = value.toLowerCase();

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
    const existingIds = new Set([...nameMatch, ...containsMatch, ...descMatch].map(p => p.id));
    intentMatch = matchedProducts.filter(p => !existingIds.has(p.id));

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

    setSearchResults(scored.slice(0, 8));
    setShowDropdown(scored.length > 0);
  };

  // ─── SEARCH TRIGGERED BY DEBOUNCE ──────────────────────────
  useEffect(() => {
    if (debouncedSearch.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchMode === 'ai') {
      handleAISearch(debouncedSearch);
    } else {
      const s = debouncedSearch.toLowerCase();
      const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        Object.values(p.specs || {}).some(v =>
          String(v).toLowerCase().includes(s)
        )
      );
      setSearchResults(results.slice(0, 8));
      setShowDropdown(results.length > 0);
    }
  }, [debouncedSearch, searchMode, allProducts]);

  // ─── FILTER PRODUCTS ────────────────────────────────────────
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

  useEffect(() => {
    filterProducts();
  }, [search, searchMode, selectedCategory, allProducts, categories]);

  // ─── SWITCH MODE ────────────────────────────────────────────
  const switchToAIMode = () => {
    setSearchMode('ai');
    setShowModeSwitchHint(false);
    setTimeout(() => filterProducts(), 100);
  };

  // ─── LEAD SUBMIT ────────────────────────────────────────────
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

  // ─── SCROLL ──────────────────────────────────────────────────
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

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ===== HEADER ===== */}
      <header className="border-b border-[#cdd5de] bg-white sticky top-0 z-50">
        <div className="bg-[#0b1f3a] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between">
            <span className="text-[12px] tracking-wider uppercase text-[#7a9cc8] font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Showcase AI — Industrial Power Solutions
            </span>
            <div className="hidden sm:flex items-center gap-5">
              <a href="tel:+919876500000" className="flex items-center gap-1.5 text-[11px] text-[#7a9cc8] hover:text-white transition-colors">
                <Phone size={11} /> +91 98765 00000
              </a>
              <a href="mailto:sales@showcaseai.com" className="flex items-center gap-1.5 text-[11px] text-[#7a9cc8] hover:text-white transition-colors">
                <Mail size={11} /> sales@showcaseai.com
              </a>
              <Link href="/admin" className="text-[11px] text-[#7a9cc8] hover:text-white transition-colors border-l border-white/[0.15] pl-5">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-[#0b1f3a] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" fill="#1a6b3c" stroke="none"/>
                <path d="M10 6L6 8.5V12.5L10 15L14 12.5V8.5L10 6Z" fill="white" stroke="none"/>
              </svg>
            </div>
            <div>
              <div className="text-[18px] leading-none tracking-wide text-[#0b1f3a] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                Showcase AI
              </div>
              <div className="text-[9px] tracking-[0.12em] text-[#5a6e82] uppercase leading-none mt-0.5">
                Product Catalog Platform
              </div>
            </div>
          </Link>

          {/* 👇 TOP SEARCH BAR REMOVED – only the hamburger, wishlist, and quote remain */}

          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 text-[#5a6e82] hover:text-[#0b1f3a]">
              <Search size={17} />
            </button>

            <Link
              href="/wishlist"
              className="relative flex items-center gap-1.5 px-3 py-1.5 border border-[#cdd5de] hover:border-[#0b1f3a] text-[12px] font-medium text-[#0b1f3a] transition-colors"
            >
              <Heart size={13} />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlist.items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#1a6b3c] text-white text-[9px] font-700 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {wishlist.items.length}
                </span>
              )}
            </Link>

            <Link
              href="/contact"
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[12px] font-600 transition-colors"
            >
              Request Quote
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-[#5a6e82] hover:text-[#0b1f3a]"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        <div className="hidden md:block border-t border-[#e8edf3] bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-0">
              {['Products', 'Categories', 'Solutions', 'Downloads', 'Contact'].map(n => (
                <Link
                  key={n}
                  href={n === 'Contact' ? '/contact' : n === 'Products' ? '/products' : n === 'Categories' ? '/categories' : '/products'}
                  className="flex items-center gap-1 px-4 py-2.5 text-[12px] font-600 uppercase tracking-wide border-b-2 border-transparent text-[#5a6e82] hover:text-[#0b1f3a] hover:border-[#cdd5de] transition-colors"
                >
                  {n}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU DRAWER ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[9999]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 w-72 h-full bg-white z-[99999] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-[#e8edf3]">
                <span className="text-[16px] font-700 uppercase text-[#0b1f3a]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#f2f5f8] rounded-full transition-colors"
                >
                  <X size={18} className="text-[#5a6e82]" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { label: 'Home', href: '/', icon: Home },
                  { label: 'Products', href: '/products', icon: Package },
                  { label: 'Categories', href: '/categories', icon: List },
                  { label: 'Wishlist', href: '/wishlist', icon: Heart },
                  { label: 'Contact', href: '/contact', icon: MessageCircle },
                  { label: 'Admin', href: '/admin', icon: User },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#0b1f3a] hover:bg-[#f2f5f8] rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon size={18} className="text-[#5a6e82]" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-[#e8edf3]">
                <p className="text-[11px] text-[#9ab0c4] text-center">© 2026 Showcase AI</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== HERO ───────────────────────────────────────────── */}
      <section className="bg-[#0b1f3a] pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[12px] tracking-widest text-[#1a6b3c] uppercase mb-3 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Industrial Power Solutions Catalog
              </p>
              <h1 className="text-[44px] sm:text-[54px] leading-none text-white uppercase mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                Precision Engineering.<br />
                <span className="text-[#1a6b3c]">Proven Performance.</span>
              </h1>
              <p className="text-[14px] text-[#7a9cc8] leading-relaxed mb-8 max-w-md">
                Explore our complete range of transformers, switchgear, solar systems, cables, and protection equipment. Shortlist products, generate PDF catalogs, and submit inquiries — all in one place.
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => setSearchMode('product')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    searchMode === 'product'
                      ? 'bg-[#1a6b3c] text-white'
                      : 'bg-white/10 text-[#7a9cc8] hover:bg-white/20 border border-white/10'
                  }`}
                >
                  Product Search
                </button>
                <button
                  onClick={() => setSearchMode('ai')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    searchMode === 'ai'
                      ? 'bg-[#1a6b3c] text-white'
                      : 'bg-white/10 text-[#7a9cc8] hover:bg-white/20 border border-white/10'
                  }`}
                >
                  ✨ AI Search
                </button>
              </div>

              <div className="relative max-w-lg min-h-[64px]">
                <div className="flex gap-0">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={searchMode === 'ai'
                        ? "Describe your power needs (e.g., UPS for 20 computers)..."
                        : "Search by product name, model, or specification..."
                      }
                      className="w-full pl-10 pr-4 py-3 bg-white border-0 text-[13px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:ring-2 focus:ring-[#1a6b3c]"
                      ref={setSearchInputRef}
                      onFocus={() => {
                        if (search.trim().length > 0 && searchResults.length > 0) {
                          setShowDropdown(true);
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (search.trim()) {
                        trackSearch(search);
                        // Trigger search immediately (debounce will handle)
                      }
                    }}
                    className="px-5 py-3 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[13px] font-600 transition-colors shrink-0 uppercase tracking-wide"
                  >
                    Search
                  </button>
                </div>

                {showDropdown && (
                  <div
                    className="absolute z-[9999] bg-white border border-[#e8edf3] shadow-xl max-h-80 overflow-y-auto w-full left-0"
                    style={{ top: 'calc(100% + 4px)' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map((product) => {
                        const category = categories.find(c => c.id === product.categoryId);
                        const imageUrl = (product.images && product.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';
                        const isNameMatch = product.name.toLowerCase().startsWith(search.toLowerCase());
                        const isAIMatch = searchMode === 'ai' && !isNameMatch && (product.score || 0) > 20;

                        return (
                          <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors border-b border-[#e8edf3] last:border-0 ${
                              isNameMatch ? 'bg-[#e8edf3]/30' : ''
                            }`}
                            onClick={() => {
                              setShowDropdown(false);
                              setSearch(product.name);
                            }}
                          >
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover bg-[#eef1f5]"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium text-[#0b1f3a] truncate">
                                {product.name}
                                {isNameMatch && (
                                  <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Best match</span>
                                )}
                                {isAIMatch && (
                                  <span className="ml-2 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">AI match</span>
                                )}
                              </p>
                              <p className="text-xs text-[#9ab0c4] truncate">{product.description}</p>
                            </div>
                            {category && (
                              <span className="text-[10px] text-[#7a9cc8] bg-[#f2f5f8] px-2 py-1">
                                {category.name}
                              </span>
                            )}
                          </Link>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-[#9ab0c4]">
                        {searchMode === 'product'
                          ? `No exact product found for "${search}". Try describing your need with AI Search`
                          : `No products found for "${search}". Try different keywords.`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showModeSwitchHint && searchMode === 'product' && search.trim() && (
                <div className="mt-2 text-sm text-amber-200 bg-amber-900/30 border border-amber-200/30 px-4 py-2 inline-flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>
                    It looks like you're describing a need.
                    <button
                      onClick={switchToAIMode}
                      className="ml-1.5 font-semibold underline hover:text-white"
                    >
                      Try AI Search →
                    </button>
                  </span>
                </div>
              )}

              {searchMode === 'ai' && (
                <p className="mt-1 text-xs text-slate-400">
                  ✨ Try: "office UPS for 10 computers" or "solar battery storage"
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {['Distribution Transformers', 'MCC Panels', 'Solar Systems', 'VCB Switchgear'].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setSearch(q);
                    }}
                    className="px-3 py-1 text-[11px] text-[#7a9cc8] border border-[#243348] hover:border-[#1a6b3c] hover:text-[#1a6b3c] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: `${allProducts.length}+`, label: 'Products', sub: 'In active catalog' },
                  { value: `${topLevelCategories.length}`, label: 'Product Lines', sub: 'Across all categories' },
                  { value: '25 Yr', label: 'Warranty', sub: 'On solar panels' },
                  { value: 'IEC', label: 'Type Tested', sub: 'All products CPRI certified' },
                ].map(s => (
                  <div key={s.label} className="border border-[#1f3a5c] p-5">
                    <p className="text-[32px] text-white leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{s.value}</p>
                    <p className="text-[13px] text-[#1a6b3c] mt-1 font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{s.label}</p>
                    <p className="text-[11px] text-[#44617a] mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCT CATEGORIES ===== */}
      <section className="py-12 border-b border-[#e8edf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-7">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[#1a6b3c]" />
              <div>
                <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Browse Catalog
                </p>
                <h2 className="text-[26px] text-[#0b1f3a] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                  Product Categories
                </h2>
              </div>
            </div>
            <Link href="/categories" className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#1a6b3c] font-600 hover:underline uppercase tracking-wide">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 border-t border-l border-[#e8edf3]">
            {topLevelCategories.map(cat => {
              const count = getTotalParentProductCount(cat.id);
              if (count === 0) return null;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="group border-r border-b border-[#e8edf3] p-5 hover:bg-[#f2f5f8] transition-colors"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="w-full h-24 bg-[#f2f5f8] overflow-hidden mb-3 group-hover:opacity-90 transition-opacity">
                    <Image
                      src={`https://placehold.co/600x400/1a56db/white?text=${encodeURIComponent(cat.name)}`}
                      alt={cat.name}
                      width={200}
                      height={96}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[13px] text-[#0b1f3a] leading-tight mb-1 font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{cat.name}</p>
                  <p className="text-[11px] text-[#5a6e82]">{count} Products</p>
                  <p className="text-[11px] text-[#1a6b3c] mt-2 group-hover:underline">Browse →</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCT FAMILIES ===== */}
      <section className="py-12 bg-[#f8fafc] border-b border-[#e8edf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-1 h-8 bg-[#0b1f3a]" />
            <div>
              <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Core Product Lines
              </p>
              <h2 className="text-[26px] text-[#0b1f3a] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                Featured Product Families
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-[#e8edf3]">
            {products.slice(0, 4).map(product => {
              const isInWishlist = wishlist.isInWishlist(product.id);
              const imageUrl = (product.images && product.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';
              return (
                <div key={product.id} className="border-r border-b border-[#e8edf3] bg-white hover:bg-[#f8fafc] transition-colors group flex flex-col">
                  <div className="relative bg-[#eef1f5] overflow-hidden h-[180px]">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      width={300}
                      height={180}
                      unoptimized={imageUrl.includes('placehold.co')}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <button
                      onClick={() => {
                        if (isInWishlist) {
                          wishlist.removeItem(product.id);
                          trackWishlistRemove(product.id);
                        } else {
                          wishlist.addItem(product);
                          trackWishlistAdd(product.id);
                        }
                      }}
                      className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center transition-all ${
                        isInWishlist ? 'bg-[#1a6b3c] text-white' : 'bg-white/90 text-[#5a6e82] hover:text-[#1a6b3c]'
                      }`}
                    >
                      <Heart size={13} fill={isInWishlist ? 'white' : 'none'} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0b1f3a]/80 px-3 py-1.5">
                      <p className="text-[10px] text-[#7a9cc8] uppercase tracking-widest truncate font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {product.specs?.Type || 'Industrial'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1 border-t border-[#e8edf3]">
                    <h3 className="text-[15px] text-[#0b1f3a] uppercase leading-tight mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                      {product.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[#f2f5f8] px-2.5 py-1.5">
                        <p className="text-[9px] text-[#9ab0c4] uppercase tracking-wide">Capacity</p>
                        <p className="text-[11px] text-[#0b1f3a] font-500 mt-0.5 font-mono">
                          {product.specs?.Capacity || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-[#f2f5f8] px-2.5 py-1.5">
                        <p className="text-[9px] text-[#9ab0c4] uppercase tracking-wide">Voltage</p>
                        <p className="text-[11px] text-[#0b1f3a] font-500 mt-0.5 font-mono">
                          {product.specs?.['Input Voltage'] || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-[#f2f5f8]">
                      <Link href={`/product/${product.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                        View Details
                      </Link>
                      <button
                        onClick={() => {
                          if (isInWishlist) {
                            wishlist.removeItem(product.id);
                            trackWishlistRemove(product.id);
                          } else {
                            wishlist.addItem(product);
                            trackWishlistAdd(product.id);
                          }
                        }}
                        className={`px-3 py-2 text-[11px] font-600 border transition-colors ${
                          isInWishlist
                            ? 'bg-[#1a6b3c] border-[#1a6b3c] text-white'
                            : 'border-[#cdd5de] text-[#5a6e82] hover:border-[#1a6b3c] hover:text-[#1a6b3c]'
                        }`}
                      >
                        <Heart size={12} fill={isInWishlist ? 'white' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== INDUSTRY SOLUTIONS ===== */}
      <section className="py-12 border-b border-[#e8edf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-1 h-8 bg-[#1a6b3c]" />
            <div>
              <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Application Areas
              </p>
              <h2 className="text-[26px] text-[#0b1f3a] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                Industry Solutions
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-[#e8edf3]">
            {[
              { name: 'Power Generation', desc: 'Transformers and switchgear for utility and captive power plants.', icon: '⚡', href: '/products?category=transformers' },
              { name: 'Industrial Facilities', desc: 'MCC, PCC, and cable solutions for process and manufacturing plants.', icon: '🏭', href: '/products?category=panels' },
              { name: 'Solar & Renewables', desc: 'Complete solar EPC packages — rooftop, ground-mounted, and hybrid.', icon: '☀️', href: '/products?category=solar' },
              { name: 'Infrastructure', desc: 'Power distribution for metro, airports, ports, and smart cities.', icon: '🏗️', href: '/products?category=switchgear' },
              { name: 'Data Centres', desc: 'Dry-type transformers, UPS-grade panels, and redundant power systems.', icon: '🖥️', href: '/products?category=panels' },
              { name: 'Marine & Offshore', desc: 'Type-tested switchgear and cables for vessels and offshore platforms.', icon: '⚓', href: '/products?category=cables' },
            ].map(s => (
              <Link
                key={s.name}
                href={s.href}
                className="group border-r border-b border-[#e8edf3] p-6 hover:bg-[#f2f5f8] transition-colors"
              >
                <span className="text-2xl mb-3 block">{s.icon}</span>
                <h3 className="text-[15px] text-[#0b1f3a] mb-2 font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{s.name}</h3>
                <p className="text-[12px] text-[#5a6e82] leading-relaxed mb-3">{s.desc}</p>
                <span className="text-[11px] text-[#1a6b3c] font-600 group-hover:underline uppercase tracking-wide">View Products →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCT SERIES SHOWCASE ===== */}
      <section className="py-12 bg-[#f8fafc] border-b border-[#e8edf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-1 h-8 bg-[#0b1f3a]" />
            <div>
              <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Detailed Listings
              </p>
              <h2 className="text-[26px] text-[#0b1f3a] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                Product Series Showcase
              </h2>
            </div>
          </div>

          <div className="space-y-0 border-t border-[#e8edf3]">
            {products.slice(0, 3).map((product, idx) => {
              const imageUrl = (product.images && product.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';
              const specs = Object.entries(product.specs || {});
              const category = categories.find(c => c.id === product.categoryId);
              return (
                <div key={product.id} className={`border-b border-[#e8edf3] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                    <div className="h-52 md:h-auto overflow-hidden bg-[#eef1f5]">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        width={400}
                        height={208}
                        className="w-full h-full object-cover"
                        unoptimized={imageUrl.includes('placehold.co')}
                      />
                    </div>
                    <div className="p-6 border-r border-[#e8edf3]">
                      <p className="text-[11px] text-[#1a6b3c] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {category?.name || 'Product'}
                      </p>
                      <h3 className="text-[20px] text-[#0b1f3a] mb-2 uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{product.name}</h3>
                      <p className="text-[13px] text-[#5a6e82] leading-relaxed mb-4">{product.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {Object.keys(product.specs || {}).slice(0, 4).map(t => (
                          <span key={t} className="px-2 py-0.5 bg-[#e8edf3] text-[10px] font-600 text-[#5a6e82] uppercase tracking-wide">{t}</span>
                        ))}
                      </div>
                      <Link
                        href={`/product/${product.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[12px] font-600 uppercase tracking-wide transition-colors"
                      >
                        View Details <ArrowRight size={12} />
                      </Link>
                    </div>
                    <div className="p-6">
                      <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Key Specifications</p>
                      <table className="w-full mt-3">
                        <tbody>
                          {specs.slice(0, 6).map(([k, v]) => (
                            <tr key={k} className="border-b border-[#f2f5f8]">
                              <td className="py-1.5 pr-3 text-[11px] text-[#5a6e82] align-top w-1/2">{k}</td>
                              <td className="py-1.5 text-[11px] font-600 text-[#0b1f3a]" style={{ fontFamily: 'DM Mono, monospace' }}>{v as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center border border-[#e8edf3] py-4 bg-white">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-[13px] font-600 text-[#0b1f3a] hover:text-[#1a6b3c] uppercase tracking-wide transition-colors"
            >
              View Complete Product Catalog ({allProducts.length}+ Products) <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== INQUIRY CTA ===== */}
      <section className="py-12 bg-[#0b1f3a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[11px] tracking-widest text-[#1a6b3c] uppercase mb-3 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Sales & Technical Inquiry
              </p>
              <h2 className="text-[34px] text-white uppercase leading-tight mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
                Build Your Shortlist.<br />
                Generate Your Catalog.<br />
                <span className="text-[#1a6b3c]">Submit Your Inquiry.</span>
              </h2>
              <p className="text-[13px] text-[#7a9cc8] leading-relaxed max-w-md">
                Add products to your wishlist, generate a professionally formatted PDF catalog with full specifications, and submit your inquiry to our technical sales team — all without leaving the platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[13px] font-600 uppercase tracking-wide transition-colors"
                >
                  <Heart size={14} />
                  Start Shortlisting
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-5 py-2.5 border border-[#1f3a5c] hover:border-[#7a9cc8] text-[#7a9cc8] hover:text-white text-[13px] font-600 uppercase tracking-wide transition-colors"
                >
                  <Phone size={14} />
                  Contact Sales
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: <Search size={16} className="text-[#1a6b3c]" />, step: '01', title: 'Discover Products', desc: 'Search and filter across 120+ industrial products.' },
                { icon: <Heart size={16} className="text-[#1a6b3c]" />, step: '02', title: 'Build Wishlist', desc: 'Shortlist products and set required quantities.' },
                { icon: <FileDown size={16} className="text-[#1a6b3c]" />, step: '03', title: 'Generate PDF Catalog', desc: 'Download a branded catalog with full specifications.' },
                { icon: <CheckCircle size={16} className="text-[#1a6b3c]" />, step: '04', title: 'Submit Inquiry', desc: 'Our technical team responds within 24 hours.' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-4 p-4 border border-[#1f3a5c]">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-[#44617a]" style={{ fontFamily: 'DM Mono, monospace' }}>{s.step}</span>
                    <div className="w-8 h-8 bg-[#1a6b3c]/20 flex items-center justify-center">
                      {s.icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-white mb-0.5 font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{s.title}</p>
                    <p className="text-[12px] text-[#7a9cc8]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0b1f3a] text-white mt-auto border-t border-[#1f3a5c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-[#1a6b3c] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" fill="#1a6b3c" stroke="none"/>
                    <path d="M10 6L6 8.5V12.5L10 15L14 12.5V8.5L10 6Z" fill="white" stroke="none"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[17px] tracking-wide uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Showcase AI</div>
                  <div className="text-[9px] tracking-[0.12em] text-[#7a9cc8] uppercase">Product Catalog Platform</div>
                </div>
              </div>
              <p className="text-[13px] text-[#7a9cc8] leading-relaxed max-w-sm">
                Premium industrial product catalog platform for power solutions, electrical equipment, solar energy, and automation products. Trusted by engineers and procurement teams across India.
              </p>
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-3 text-[12px] text-[#7a9cc8]">
                  <Phone size={12} className="text-[#1a6b3c] shrink-0" />
                  +91 98765 00000 · +91 87654 99999
                </div>
                <div className="flex items-center gap-3 text-[12px] text-[#7a9cc8]">
                  <Mail size={12} className="text-[#1a6b3c] shrink-0" />
                  sales@showcaseai.com · info@showcaseai.com
                </div>
                <div className="flex items-start gap-3 text-[12px] text-[#7a9cc8]">
                  <MapPin size={12} className="text-[#1a6b3c] shrink-0 mt-0.5" />
                  Plot 45, MIDC Industrial Area, Pimpri-Chinchwad, Pune — 411019, Maharashtra
                </div>
              </div>
            </div>

            <div>
              <p className="text-[13px] uppercase tracking-widest text-[#1a6b3c] mb-4 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Product Range
              </p>
              <ul className="space-y-2">
                {['Power Transformers', 'Control Panels', 'Solar Energy Systems', 'Switchgear', 'Cables & Wiring', 'Protection Relays'].map(l => (
                  <li key={l}>
                    <Link href={`/products?category=${l.toLowerCase().replace(/\s/g, '')}`} className="text-[12px] text-[#7a9cc8] hover:text-white transition-colors">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[13px] uppercase tracking-widest text-[#1a6b3c] mb-4 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Support
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  { label: 'Technical Documentation', href: '/products' },
                  { label: 'Product Catalog (PDF)', href: '/wishlist' },
                  { label: 'My Wishlist', href: '/wishlist' },
                  { label: 'Request a Quote', href: '/contact' },
                  { label: 'Admin Portal', href: '/admin' },
                ].map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[12px] text-[#7a9cc8] hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {['IEC 60076', 'IS 1180', 'CPRI', 'BEE 5★'].map(c => (
                  <span key={c} className="px-2 py-0.5 text-[10px] font-600 border border-[#1a6b3c]/50 text-[#1a6b3c] uppercase tracking-wide">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-[#44617a]">© 2026 Showcase AI. All rights reserved. CIN: U31100MH2005PLC000123</p>
            <div className="flex items-center gap-5">
              <span className="text-[11px] text-[#44617a]">Privacy Policy</span>
              <span className="text-[11px] text-[#44617a]">Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== QUICK VIEW MODAL ===== */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 overflow-hidden border border-slate-200">
                <Image
                  src={(selectedProduct.images && selectedProduct.images[0]) || 'https://placehold.co/600x600/1a56db/white?text=No+Image'}
                  alt={selectedProduct.name}
                  width={300}
                  height={300}
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#16293f] transition-colors"
                    onClick={() => {
                      wishlist.addItem(selectedProduct);
                      trackWishlistAdd(selectedProduct.id);
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
                    <button className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
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
        <DialogContent className="sm:max-w-md p-6 shadow-xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
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
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1e3a5f] transition-colors"
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
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1e3a5f] transition-colors"
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
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1e3a5f] transition-colors"
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
                className="w-full mt-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1e3a5f] transition-colors"
                value={leadForm.message}
                onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
              />
            </div>
            {wishlist.items.length > 0 && (
              <div className="bg-slate-50 p-3 border border-slate-200">
                <p className="text-xs font-medium text-slate-500">Selected products</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {wishlist.items.map((p) => p.name).join(', ')}
                </p>
              </div>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#16293f] transition-colors"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit inquiry'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* ===== AI ADVISOR (placed at the very end) ===== */}
      <AIAdvisor />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white">Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}