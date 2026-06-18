// app/product/[id]/client.tsx — Complete Layout Overhaul
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ArrowLeft, Check, ZoomIn, X, ChevronLeft, ChevronRight, Clock, Tag, Info, Package, Ruler, Weight, Zap } from 'lucide-react';
import { useWishlist } from '@/store/wishlist';
import { toast } from 'sonner';
import { mockApi } from '@/lib/mockApi';

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
  const wishlist = useWishlist();
  const isInWishlist = wishlist.isInWishlist(product.id);
  const primary = company.primaryColor;

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const all = await mockApi.getProducts(company.id);
        const related = all
          .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
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

  // Helper to get icon for spec key
  const getSpecIcon = (key: string) => {
    const lower = key.toLowerCase();
    if (lower.includes('weight')) return Weight;
    if (lower.includes('dimension')) return Ruler;
    if (lower.includes('power') || lower.includes('capacity') || lower.includes('kva')) return Zap;
    return Package;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white"
    >
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Catalog</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={shareProduct}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                aria-label="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Left: Image Gallery — takes 3 columns on large screens */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-24"
            >
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200/60 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={images[selectedImage]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5 text-gray-600" />
                </button>
                {product.badge && (
                  <span className="absolute top-4 left-4 bg-amber-500/90 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> {product.badge}
                  </span>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedImage === idx ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img} alt={`${product.name} thumbnail ${idx+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Product Info — takes 2 columns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {product.name}
              </h1>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {product.description}
              </p>
            </motion.div>

            {/* Specs Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6"
            >
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4" /> Specifications
              </h2>
              <div className="space-y-3">
                {Object.entries(product.specs).map(([key, value]) => {
                  const Icon = getSpecIcon(key);
                  return (
                    <div key={key} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-medium">{key}</p>
                        <p className="text-sm text-gray-800 font-medium">{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Action Buttons — Sticky Card on Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 sticky bottom-0 lg:static bg-white/90 backdrop-blur-sm lg:bg-white lg:backdrop-blur-none"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToWishlist}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
                    isInWishlist
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'text-white hover:opacity-90'
                  }`}
                  style={isInWishlist ? {} : { backgroundColor: primary }}
                >
                  <Heart className="h-5 w-5" fill={isInWishlist ? 'white' : 'none'} />
                  {isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}
                </button>
                <a
                  href={`https://wa.me/${company.whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Inquire via WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
              </div>
              {isInWishlist && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  This product is in your wishlist
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 pt-10 border-t border-gray-200/60"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>✨ You might also like</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel, idx) => (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={`/product/${rel.id}`}
                    className="group bg-white rounded-xl border border-gray-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 block"
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={rel.images[0]}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{rel.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-1">{rel.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2"
              onClick={() => setIsZoomed(false)}
            >
              <X className="h-8 w-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[selectedImage]}
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}