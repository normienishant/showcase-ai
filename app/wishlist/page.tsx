// app/wishlist/page.tsx — Wishlist with proper store methods
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, BookMarked, ArrowRight, FileDown, Send, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/store/wishlist';
import { trackWishlistAdd, trackWishlistRemove, trackPDFDownload } from '@/lib/tracking';

export default function WishlistPage() {
  const { items, removeItem, updateQuantity, totalQuantity } = useWishlist();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-[#f8fafc]">
        <div className="border border-[#e8edf3] bg-white p-12 text-center max-w-sm w-full">
          <ShoppingBag size={36} className="text-[#cdd5de] mx-auto mb-4" />
          <h2 className="text-[22px] text-[#0b1f3a] uppercase mb-2 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Wishlist Empty
          </h2>
          <p className="text-[13px] text-[#5a6e82] mb-6 leading-relaxed">
            Browse the product catalog and shortlist items to build your personalized product list.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a6b3c] text-white text-[12px] font-600 uppercase tracking-wide hover:bg-[#155731] transition-colors"
          >
            Browse Catalog <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  const totalQty = totalQuantity();
  const categoriesCovered = new Set(items.map(i => i.categoryId).filter(Boolean)).size;

  const handleRemove = (id: string) => {
    removeItem(id);
    trackWishlistRemove(id);
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    updateQuantity(id, newQty);
    // We only track if quantity increases; trackWishlistAdd/Remove already handled on add/remove
  };

  const handlePDFGenerate = () => {
    trackPDFDownload(items.map(i => i.id));
    router.push('/pdf-success');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#0b1f3a] border-b border-[#1f3a5c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-[11px] text-[#44617a] mb-1">Home · Wishlist</p>
          <div className="flex items-center gap-3">
            <BookMarked size={20} className="text-[#1a6b3c]" />
            <div>
              <h1 className="text-[28px] text-white uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                My Shortlist
              </h1>
              <p className="text-[12px] text-[#7a9cc8]">
                {items.length} product{items.length !== 1 ? 's' : ''} · Ready to generate personalized catalog
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="border border-[#e8edf3] bg-white">
              <div className="bg-[#f2f5f8] border-b border-[#e8edf3] px-4 py-3">
                <p className="text-[12px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Selected Products
                </p>
              </div>

              {items.map((item, idx) => (
                <div key={item.id} className={`flex items-start gap-4 p-4 ${idx < items.length - 1 ? 'border-b border-[#e8edf3]' : ''}`}>
                  <div className="w-20 h-16 bg-[#eef1f5] overflow-hidden shrink-0 border border-[#e8edf3]">
                    <img src={item.images?.[0] || 'https://placehold.co/600x400/1a56db/white?text=No+Image'} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-[#9ab0c4] mb-0.5 font-mono">{item.id.slice(0, 8)}</p>
                        <Link href={`/product/${item.id}`}>
                          <h3 className="text-[14px] text-[#0b1f3a] uppercase hover:text-[#1a6b3c] transition-colors leading-tight font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-[#9ab0c4] mt-0.5">Product</p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 hover:bg-red-50 text-[#cdd5de] hover:text-red-500 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[11px] text-[#9ab0c4] uppercase tracking-wide">Qty:</span>
                      <div className="flex items-center border border-[#cdd5de]">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-7 h-6 flex items-center justify-center hover:bg-[#f2f5f8] text-[#5a6e82] border-r border-[#cdd5de] transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-8 text-center text-[12px] text-[#0b1f3a] font-mono">{item.quantity ?? 1}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-7 h-6 flex items-center justify-center hover:bg-[#f2f5f8] text-[#5a6e82] border-l border-[#cdd5de] transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-[#e8edf3] p-3">
                <Link
                  href="/products"
                  className="flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#cdd5de] text-[12px] text-[#9ab0c4] hover:border-[#1a6b3c] hover:text-[#1a6b3c] transition-colors uppercase tracking-wide font-600"
                >
                  + Add More Products
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-[#e8edf3] bg-white">
              <div className="bg-[#0b1f3a] px-4 py-3">
                <span className="text-[12px] text-white uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Catalog Summary
                </span>
              </div>
              <div className="p-4 border-b border-[#e8edf3]">
                <table className="w-full">
                  <tbody>
                    {[
                      ['Products selected', items.length],
                      ['Total quantity', totalQty],
                      ['Categories covered', categoriesCovered],
                    ].map(([k, v]) => (
                      <tr key={String(k)}>
                        <td className="py-1.5 text-[12px] text-[#5a6e82]">{k}</td>
                        <td className="py-1.5 text-right">
                          <span className="text-[13px] font-500 text-[#0b1f3a] font-mono">{v}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 space-y-2.5">
                <button
                  onClick={handlePDFGenerate}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[12px] font-600 uppercase tracking-wide transition-colors"
                >
                  <FileDown size={14} />
                  Generate PDF Catalog
                </button>
                <button
                  onClick={() => router.push('/contact')}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[12px] font-600 uppercase tracking-wide transition-colors"
                >
                  <Send size={14} />
                  Submit Technical Inquiry
                </button>
              </div>
            </div>

            <div className="border border-[#1a6b3c]/30 bg-[#1a6b3c]/5 p-4">
              <p className="text-[12px] text-[#0b1f3a] mb-3 uppercase tracking-wide font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Your PDF Catalog Includes:
              </p>
              <ul className="space-y-2">
                {[
                  'Full technical specifications table',
                  'High-resolution product images',
                  'Certifications and standards list',
                  'Company letterhead and contact',
                  'Downloadable datasheets links',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[12px] text-[#5a6e82]">
                    <span className="w-1 h-1 rounded-full bg-[#1a6b3c] mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}