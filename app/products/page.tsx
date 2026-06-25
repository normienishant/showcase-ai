// app/products/page.tsx — Figma Product Listing with Child Category Filtering
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, X, LayoutGrid, List, Filter, ChevronDown, ChevronUp, BookMarked } from 'lucide-react';
import { api } from '@/lib/api';
import { useWishlist } from '@/store/wishlist';
import { toast } from 'sonner';

// ─── Helper: get category IDs including children ─────────────
function getCategoryIds(catId: string, categories: any[]): string[] {
  const result = [catId];
  const childIds = categories
    .filter(c => c.parentId === catId)
    .map(c => c.id);
  return [...result, ...childIds];
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e8edf3]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#f2f5f8] transition-colors"
      >
        <span className="text-[12px] text-[#0b1f3a] uppercase tracking-wide font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{title}</span>
        {open ? <ChevronUp size={13} className="text-[#5a6e82]" /> : <ChevronDown size={13} className="text-[#5a6e82]" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function ProductListingPage() {
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const wishlist = useWishlist();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const companyData = await api.getCompany('bpe');
        setCompany(companyData);
        const cats = await api.getCategories(companyData.id);
        setCategories(cats);
        const prods = await api.getProducts(companyData.id);
        setAllProducts(prods);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─── Filter products with child category support ────────────
  const filtered = useMemo(() => {
    return allProducts.filter(p => {
      const matchSearch = !search || [p.name, p.description, ...Object.keys(p.specs || {})].some(s =>
        s?.toLowerCase().includes(search.toLowerCase())
      );
      let matchCat = true;
      if (selectedCategory) {
        const allowedIds = getCategoryIds(selectedCategory, categories);
        matchCat = allowedIds.includes(p.categoryId);
      }
      return matchSearch && matchCat;
    });
  }, [allProducts, search, selectedCategory, categories]);

  const certGroups = ['IEC 60076', 'IS 1180', 'CPRI', 'BEE 5-Star'];

  const toggleCert = (c: string) => {
    setSelectedCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const activeFiltersCount = [selectedCategory, ...selectedCerts].filter(Boolean).length;

  const SidebarContent = () => (
    <div className="bg-white border border-[#e8edf3]">
      <div className="bg-[#0b1f3a] px-4 py-3 flex items-center justify-between">
        <span className="text-[13px] text-white uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Filter Products
        </span>
        {activeFiltersCount > 0 && (
          <button
            onClick={() => { setSelectedCategory(''); setSelectedCerts([]); setSearch(''); }}
            className="text-[11px] text-[#7a9cc8] hover:text-white"
          >
            Clear all ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className="border-b border-[#e8edf3] p-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-8 pr-3 py-2 bg-[#f2f5f8] border border-[#e8edf3] text-[12px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#1a6b3c] transition-colors"
          />
        </div>
      </div>

      <FilterSection title="Product Category">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" name="category" checked={!selectedCategory} onChange={() => setSelectedCategory('')} className="accent-[#1a6b3c]" />
            <span className="text-[12px] text-[#0b1f3a] group-hover:text-[#1a6b3c] transition-colors">All Categories</span>
            <span className="ml-auto text-[10px] text-[#9ab0c4]">{allProducts.length}</span>
          </label>
          {categories.filter(c => c.parentId === null).map(cat => {
            const count = allProducts.filter(p => getCategoryIds(cat.id, categories).includes(p.categoryId)).length;
            return (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name="category" checked={selectedCategory === cat.id} onChange={() => setSelectedCategory(cat.id)} className="accent-[#1a6b3c]" />
                <span className="text-[12px] text-[#0b1f3a] group-hover:text-[#1a6b3c] transition-colors">{cat.name}</span>
                <span className="ml-auto text-[10px] text-[#9ab0c4]">{count}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Standards & Certifications" defaultOpen={false}>
        <div className="space-y-1.5">
          {certGroups.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedCerts.includes(c)} onChange={() => toggleCert(c)} className="accent-[#1a6b3c]" />
              <span className="text-[12px] text-[#0b1f3a]">{c}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0b1f3a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e8edf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[#0b1f3a]" />
              <div>
                <h1 className="text-[28px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Products' : 'All Products'}
                </h1>
                <p className="text-[12px] text-[#5a6e82]">{filtered.length} products found</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 border text-[12px] font-600 uppercase tracking-wide transition-colors ${
                  activeFiltersCount > 0 ? 'border-[#1a6b3c] text-[#1a6b3c] bg-[#1a6b3c]/5' : 'border-[#cdd5de] text-[#5a6e82]'
                }`}
              >
                <Filter size={13} />
                Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
              <div className="flex items-center border border-[#cdd5de]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#0b1f3a] text-white' : 'bg-white text-[#9ab0c4] hover:text-[#5a6e82]'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#0b1f3a] text-white' : 'bg-white text-[#9ab0c4] hover:text-[#5a6e82]'}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCategory && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0b1f3a] text-white text-[11px] font-600 uppercase">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('')}><X size={10} /></button>
                </span>
              )}
              {selectedCerts.map(c => (
                <span key={c} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a6b3c] text-white text-[11px] font-600">
                  {c} <button onClick={() => toggleCert(c)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <SidebarContent />
          </aside>

          {filterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="flex-1 bg-black/40" onClick={() => setFilterOpen(false)} />
              <div className="w-72 bg-white overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-[#e8edf3]">
                  <span className="text-[15px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Filters</span>
                  <button onClick={() => setFilterOpen(false)}><X size={18} className="text-[#5a6e82]" /></button>
                </div>
                <SidebarContent />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {filtered.length > 0 ? (
              <div className={`border-t border-l border-[#e8edf3] ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-1'}`}>
                {filtered.map(product => {
                  const isInWishlist = wishlist.isInWishlist(product.id);
                  const imageUrl = (product.images && product.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';
                  const category = categories.find(c => c.id === product.categoryId);

                  if (viewMode === 'list') {
                    return (
                      <div key={product.id} className="border-r border-b border-[#e8edf3] bg-white hover:bg-[#f8fafc] transition-colors group flex flex-col sm:flex-row">
                        <div className="w-full sm:w-48 h-40 sm:h-auto bg-[#eef1f5] overflow-hidden shrink-0">
                          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                        </div>
                        <div className="flex flex-col flex-1 p-5">
                          <p className="text-[10px] text-[#1a6b3c] uppercase tracking-widest mb-1 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {category?.name || 'Product'}
                          </p>
                          <h3 className="text-[17px] text-[#0b1f3a] uppercase leading-tight mb-2 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {product.name}
                          </h3>
                          <p className="text-[12px] text-[#5a6e82] leading-relaxed flex-1 mb-3">{product.description}</p>
                          <div className="flex items-center gap-2">
                            <Link href={`/product/${product.id}`} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                              View Details
                            </Link>
                            <button
                              onClick={() => isInWishlist ? wishlist.removeItem(product.id) : wishlist.addItem(product)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-600 uppercase tracking-wide border transition-colors ${
                                isInWishlist
                                  ? 'bg-[#1a6b3c] border-[#1a6b3c] text-white'
                                  : 'border-[#cdd5de] text-[#5a6e82] hover:border-[#1a6b3c] hover:text-[#1a6b3c]'
                              }`}
                            >
                              <BookMarked size={11} />
                              {isInWishlist ? 'Saved' : 'Shortlist'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={product.id} className="border-r border-b border-[#e8edf3] bg-white hover:bg-[#f8fafc] transition-colors group flex flex-col">
                      <div className="relative bg-[#eef1f5] overflow-hidden h-[180px]">
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                        <button
                          onClick={() => isInWishlist ? wishlist.removeItem(product.id) : wishlist.addItem(product)}
                          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center transition-all ${
                            isInWishlist ? 'bg-[#1a6b3c] text-white' : 'bg-white/90 text-[#5a6e82] hover:text-[#1a6b3c]'
                          }`}
                        >
                          <BookMarked size={13} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-[#0b1f3a]/80 px-3 py-1.5">
                          <p className="text-[10px] text-[#7a9cc8] uppercase tracking-widest truncate font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {category?.name || 'Product'}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 border-t border-[#e8edf3]">
                        <h3 className="text-[15px] text-[#0b1f3a] uppercase leading-tight mb-2 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
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
                            onClick={() => isInWishlist ? wishlist.removeItem(product.id) : wishlist.addItem(product)}
                            className={`px-3 py-2 text-[11px] font-600 border transition-colors ${
                              isInWishlist
                                ? 'bg-[#1a6b3c] border-[#1a6b3c] text-white'
                                : 'border-[#cdd5de] text-[#5a6e82] hover:border-[#1a6b3c] hover:text-[#1a6b3c]'
                            }`}
                          >
                            <BookMarked size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-[#e8edf3] bg-white py-20 text-center">
                <p className="text-[20px] text-[#0b1f3a] uppercase mb-2 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No Products Found</p>
                <p className="text-[13px] text-[#5a6e82] mb-5">Try adjusting your search terms or filters.</p>
                <button
                  onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedCerts([]); }}
                  className="px-4 py-2 bg-[#1a6b3c] text-white text-[12px] font-600 uppercase tracking-wide hover:bg-[#155731] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}