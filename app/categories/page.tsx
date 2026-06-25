// app/categories/page.tsx — Figma Categories UI
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useWishlist } from '@/store/wishlist';

export default function CategoriesPage() {
  const [company, setCompany] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const wishlist = useWishlist();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const companyData = await api.getCompany('bpe');
        setCompany(companyData);
        const cats = await api.getCategories(companyData.id);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const topLevel = filtered.filter(c => c.parentId === null);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0b1f3a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0b1f3a] pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] text-[#1a6b3c] uppercase tracking-widest mb-2 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Product Catalog
          </p>
          <h1 className="text-[40px] text-white uppercase mb-4 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Product Categories
          </h1>
          <p className="text-[13px] text-[#7a9cc8] max-w-lg mb-6">
            Browse our complete product range organized by equipment category. Each category contains full technical specifications, model variants, and downloadable datasheets.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1f3a5c] border border-[#2a4f7a] text-[13px] text-white placeholder-[#7a9cc8] outline-none focus:border-[#1a6b3c] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-[#e8edf3]">
          {topLevel.map(cat => {
            const subCount = categories.filter(c => c.parentId === cat.id).length;
            const totalCount = subCount + 1; // approximate
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group border-r border-b border-[#e8edf3] bg-white hover:bg-[#f8fafc] transition-colors flex flex-col"
              >
                <div className="relative h-48 bg-[#eef1f5] overflow-hidden">
                  <img
                    src={`https://placehold.co/600x400/1a56db/white?text=${encodeURIComponent(cat.name)}`}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-[#0b1f3a]/30" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <div>
                      <span className="text-[10px] text-[#7a9cc8] uppercase tracking-widest block mb-1 font-mono">
                        {totalCount} Products
                      </span>
                      <h2 className="text-[22px] text-white uppercase leading-tight font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {cat.name}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[12px] text-[#5a6e82] leading-relaxed flex-1 mb-4">
                    Explore our full range of {cat.name.toLowerCase()} products.
                  </p>
                  <div className="flex items-center gap-2 text-[12px] font-600 text-[#1a6b3c] group-hover:text-[#155731] uppercase tracking-wide pt-3 border-t border-[#e8edf3]">
                    Browse {totalCount} Products
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {topLevel.length === 0 && (
          <div className="border border-[#e8edf3] py-16 text-center">
            <p className="text-[20px] text-[#0b1f3a] uppercase mb-2 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>No Categories Found</p>
            <p className="text-[13px] text-[#9ab0c4]">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}