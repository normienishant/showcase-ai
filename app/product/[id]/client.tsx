// app/product/[id]/client.tsx — Figma Product Detail UI (with Heart Icon)
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ArrowLeft, Check, ZoomIn, X, ChevronLeft, ChevronRight, Clock, Package, Ruler, Weight, Zap, ExternalLink, Phone, FileText } from 'lucide-react';
import { useWishlist } from '@/store/wishlist';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Download } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  specs: Record<string, string>;
  badge?: string;
}

interface Company {
  id: string;
  name: string;
  primaryColor: string;
  whatsappNumber: string;
}

export default function ClientProductDetail({ product, company }: { product: Product; company: Company }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'features' | 'applications' | 'downloads'>('specs');

  const wishlist = useWishlist();
  const isInWishlist = wishlist.isInWishlist(product.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const all = await api.getProducts(company.id);
        const related = all
          .filter((p: Product) => p.categoryId === product.categoryId && p.id !== product.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error('Failed to fetch related products', error);
      }
    };
    fetchRelated();
  }, [product.categoryId, product.id, company.id]);

  const handleAddToWishlist = () => {
    if (isInWishlist) {
      wishlist.removeItem(product.id);
      toast.info(`Removed ${product.name} from wishlist`);
    } else {
      wishlist.addItem(product);
      toast.success(`Added ${product.name} to wishlist`);
    }
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${product.name} - ${window.location.href}`);
      toast.success('Product link copied to clipboard!');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi BPE Team,\nI'm interested in the product: ${product.name}\n\n${product.description}\n\nPlease contact me.`
  );

  const images = product.images || ['https://placehold.co/600x600/1a56db/white?text=No+Image'];

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + images.length) % images.length);

  const getSpecIcon = (key: string) => {
    const lower = key.toLowerCase();
    if (lower.includes('weight')) return Weight;
    if (lower.includes('dimension')) return Ruler;
    if (lower.includes('power') || lower.includes('capacity') || lower.includes('kva')) return Zap;
    return Package;
  };

  const tabs = [
    { id: 'specs' as const, label: 'Specifications' },
    { id: 'features' as const, label: 'Features' },
    { id: 'applications' as const, label: 'Applications' },
    { id: 'downloads' as const, label: `Downloads` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white"
    >
      {/* Breadcrumb */}
      <div className="bg-[#f2f5f8] border-b border-[#e8edf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-1.5 text-[11px] text-[#9ab0c4]">
          <Link href="/" className="hover:text-[#1a6b3c]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#1a6b3c]">Products</Link>
          <span>/</span>
          <span className="text-[#5a6e82] truncate max-w-[220px]">{product.name}</span>
        </div>
      </div>

      {/* Product header band */}
      <div className="bg-[#0b1f3a] border-b border-[#1f3a5c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-[#1a6b3c] uppercase tracking-widest mb-0.5 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Product Detail
            </p>
            <h1 className="text-[20px] sm:text-[26px] text-white uppercase leading-tight font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {product.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 text-[10px] font-700 uppercase tracking-wide bg-[#1a6b3c] text-white">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT: Gallery */}
          <div>
            <div className="relative border border-[#e8edf3] bg-[#eef1f5] overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={selectedImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-[#cdd5de] flex items-center justify-center hover:bg-[#f2f5f8] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-[#0b1f3a]" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={selectedImage === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-[#cdd5de] flex items-center justify-center hover:bg-[#f2f5f8] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={16} className="text-[#0b1f3a]" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-12 border-2 overflow-hidden transition-all bg-[#eef1f5] ${
                      i === selectedImage ? 'border-[#0b1f3a]' : 'border-[#e8edf3] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Certifications */}
            <div className="mt-5 p-4 border border-[#e8edf3] bg-[#f8fafc]">
              <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest mb-2 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Certifications & Standards
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['IEC 60076', 'IS 1180', 'CPRI Type Tested', 'BEE 5-Star'].map(c => (
                  <span key={c} className="flex items-center gap-1 px-2.5 py-1 border border-[#1a6b3c]/40 text-[11px] text-[#1a6b3c] font-600 uppercase tracking-wide">
                    <Check size={10} />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div>
            <p className="text-[13px] text-[#5a6e82] leading-relaxed mb-5">{product.description}</p>

            {/* Quick specs table */}
            <div className="border border-[#e8edf3] mb-5">
              <div className="bg-[#0b1f3a] px-4 py-2.5">
                <span className="text-[12px] text-white uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Key Specifications
                </span>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(product.specs).slice(0, 8).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                      <td className="px-4 py-2.5 text-[12px] text-[#5a6e82] border-b border-[#e8edf3] w-1/2">{k}</td>
                      <td className="px-4 py-2.5 border-b border-[#e8edf3]">
                        <span className="text-[12px] text-[#0b1f3a] font-mono">{v}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 bg-[#f2f5f8] border-t border-[#e8edf3]">
                <button onClick={() => setActiveTab('specs')} className="text-[11px] text-[#1a6b3c] font-600 hover:underline uppercase tracking-wide">
                  View all {Object.keys(product.specs).length} specifications →
                </button>
              </div>
            </div>

            {/* Capacity / Voltage highlight */}
            <div className="grid grid-cols-2 gap-0 border border-[#e8edf3] mb-5">
              <div className="p-4 border-r border-[#e8edf3]">
                <p className="text-[10px] text-[#9ab0c4] uppercase tracking-widest mb-1">Capacity Range</p>
                <p className="text-[15px] text-[#0b1f3a] font-500 font-mono">{product.specs?.Capacity || 'N/A'}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-[#9ab0c4] uppercase tracking-widest mb-1">Voltage Range</p>
                <p className="text-[15px] text-[#0b1f3a] font-500 font-mono">{product.specs?.['Input Voltage'] || 'N/A'}</p>
              </div>
            </div>

            {/* Action buttons with Heart Icon */}
            <div className="space-y-2.5 mb-5">
              {mounted ? (
                <button
                  onClick={handleAddToWishlist}
                  className={`w-full flex items-center justify-center gap-2 py-3 text-[13px] font-600 uppercase tracking-wide transition-colors ${
                    isInWishlist
                      ? 'bg-[#1a6b3c] text-white hover:bg-[#155731]'
                      : 'bg-[#0b1f3a] text-white hover:bg-[#1a3055]'
                  }`}
                >
                  <Heart className="h-5 w-5" fill={isInWishlist ? 'white' : 'none'} />
                  {isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-600 uppercase tracking-wide bg-gray-300 text-gray-500 animate-pulse cursor-default">
                  <Heart className="h-5 w-5" /> Loading...
                </button>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/contact"
                  className="flex flex-col items-center gap-1 py-3 border-2 border-[#0b1f3a] hover:bg-[#0b1f3a] hover:text-white text-[#0b1f3a] text-center text-[11px] font-600 uppercase tracking-wide transition-colors"
                >
                  <Phone size={13} />
                  Quote
                </Link>
                <a
                  href={`https://wa.me/${company.whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 py-3 border-2 border-[#25D366] hover:bg-[#25D366] hover:text-white text-[#25D366] text-center text-[11px] font-600 uppercase tracking-wide transition-colors"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
                <button
                  onClick={shareProduct}
                  className="flex flex-col items-center gap-1 py-3 border-2 border-[#cdd5de] hover:border-[#0b1f3a] text-[#5a6e82] hover:text-[#0b1f3a] text-center text-[11px] font-600 uppercase tracking-wide transition-colors"
                >
                  <Share2 size={13} />
                  Share
                </button>
              </div>
            </div>

            {/* Model number */}
            <div className="border-t border-[#e8edf3] pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9ab0c4] uppercase tracking-widest">Model Number</p>
                <p className="text-[13px] text-[#0b1f3a] font-500 mt-0.5 font-mono">{product.id.slice(0, 12)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="mt-10 border border-[#e8edf3]">
          <div className="flex border-b border-[#e8edf3] bg-[#f8fafc]">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 text-[12px] uppercase tracking-wide border-b-2 transition-colors font-600 ${
                  activeTab === t.id
                    ? 'border-[#0b1f3a] text-[#0b1f3a] bg-white'
                    : 'border-transparent text-[#5a6e82] hover:text-[#0b1f3a] hover:border-[#cdd5de]'
                }`}
                style={{ fontFamily: 'Barlow, sans-serif' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Specifications */}
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <table className="w-full border border-[#e8edf3]">
                    <tbody>
                      {Object.entries(product.specs).slice(0, Math.ceil(Object.entries(product.specs).length / 2)).map(([k, v], i) => (
                        <tr key={k} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                          <td className="px-4 py-2.5 text-[12px] text-[#5a6e82] border-b border-[#e8edf3] w-1/2">{k}</td>
                          <td className="px-4 py-2.5 border-b border-[#e8edf3]">
                            <span className="text-[12px] text-[#0b1f3a] font-mono">{v}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="w-full border border-[#e8edf3]">
                    <tbody>
                      {Object.entries(product.specs).slice(Math.ceil(Object.entries(product.specs).length / 2)).map(([k, v], i) => (
                        <tr key={k} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                          <td className="px-4 py-2.5 text-[12px] text-[#5a6e82] border-b border-[#e8edf3] w-1/2">{k}</td>
                          <td className="px-4 py-2.5 border-b border-[#e8edf3]">
                            <span className="text-[12px] text-[#0b1f3a] font-mono">{v}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Features */}
            {activeTab === 'features' && (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['High efficiency design', 'Advanced monitoring capabilities', 'Wide input voltage range', 'IEC certified'].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 border border-[#e8edf3] bg-[#f8fafc]">
                    <div className="w-6 h-6 bg-[#0b1f3a] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[9px] font-mono">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="text-[13px] text-[#4a5668] leading-relaxed">{f}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Applications */}
            {activeTab === 'applications' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {['Industrial manufacturing', 'Commercial complexes', 'Data centers', 'Renewable energy'].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border border-[#e8edf3]">
                    <div className="w-1 h-full min-h-[2.5rem] bg-[#1a6b3c] shrink-0" />
                    <p className="text-[13px] text-[#0b1f3a] font-medium leading-snug">{a}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Downloads */}
            {activeTab === 'downloads' && (
              <div className="space-y-2">
                {[
                  { name: 'Technical Data Sheet', type: 'PDF', size: '2.4 MB' },
                  { name: 'Installation Manual', type: 'PDF', size: '5.1 MB' },
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-[#e8edf3] hover:bg-[#f8fafc] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#0b1f3a] flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#0b1f3a] font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{d.name}</p>
                        <p className="text-[11px] text-[#9ab0c4] mt-0.5 font-mono">{d.type} · {d.size}</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-1 h-7 bg-[#0b1f3a]" />
              <h2 className="text-[22px] text-[#0b1f3a] uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Related Products
              </h2>
              <Link href={`/products?category=${product.categoryId}`} className="ml-auto text-[11px] text-[#1a6b3c] font-600 hover:underline uppercase tracking-wide">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-[#e8edf3]">
              {relatedProducts.map(rel => {
                const isInWishlist = wishlist.isInWishlist(rel.id);
                const imageUrl = (rel.images && rel.images[0]) || 'https://placehold.co/600x400/1a56db/white?text=No+Image';
                return (
                  <div key={rel.id} className="border-r border-b border-[#e8edf3] bg-white hover:bg-[#f8fafc] transition-colors group flex flex-col">
                    <div className="relative bg-[#eef1f5] overflow-hidden h-[140px]">
                      <img src={imageUrl} alt={rel.name} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                      <button
                        onClick={() => isInWishlist ? wishlist.removeItem(rel.id) : wishlist.addItem(rel)}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center transition-all ${
                          isInWishlist ? 'bg-[#1a6b3c] text-white' : 'bg-white/90 text-[#5a6e82] hover:text-[#1a6b3c]'
                        }`}
                      >
                        <Heart size={13} fill={isInWishlist ? 'white' : 'none'} />
                      </button>
                    </div>
                    <div className="p-4 flex flex-col flex-1 border-t border-[#e8edf3]">
                      <h3 className="text-[15px] text-[#0b1f3a] uppercase leading-tight mb-2 font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {rel.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-[#f2f5f8]">
                        <Link href={`/product/${rel.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[11px] font-600 uppercase tracking-wide transition-colors">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <button className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2" onClick={() => setIsZoomed(false)}>
              <X size={32} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[selectedImage]}
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}