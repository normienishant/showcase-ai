// app/pdf-success/page.tsx — PDF Success with fixed quantity
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Download, Send, ArrowRight, FileText } from 'lucide-react';
import { useWishlist } from '@/store/wishlist';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { CatalogPDF } from '@/components/PDFCatalog';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

export default function PDFSuccessPage() {
  const { items } = useWishlist();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await api.getCompany('bpe');
        setCompany(data);
      } catch (error) {
        console.error('Failed to load company:', error);
      }
    };
    loadCompany();
  }, []);

  if (!company) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white border border-[#e8edf3]">
          <div className="bg-[#1a6b3c] px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] text-[#7ecda0] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Catalog Generated
              </p>
              <h1 className="text-[22px] text-white uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Your catalog is ready
              </h1>
            </div>
          </div>

          <div className="p-6">
            <p className="text-[13px] text-[#5a6e82] leading-relaxed mb-6">
              Your personalized product catalog has been compiled with full technical specifications, certifications, and product imagery for {items.length > 0 ? `${items.length} selected product${items.length !== 1 ? 's' : ''}` : 'your selected products'}.
            </p>

            {items.length > 0 && (
              <div className="border border-[#e8edf3] mb-6">
                <div className="bg-[#f2f5f8] border-b border-[#e8edf3] px-4 py-2.5">
                  <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Catalog Contents
                  </p>
                </div>
                {items.slice(0, 5).map((item, i) => (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < Math.min(items.length, 5) - 1 ? 'border-b border-[#f2f5f8]' : ''}`}>
                    <div className="w-9 h-8 bg-[#eef1f5] overflow-hidden shrink-0">
                      <img src={item.images?.[0] || 'https://placehold.co/600x400/1a56db/white?text=No+Image'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#0b1f3a] font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>{item.name}</p>
                      <p className="text-[10px] text-[#9ab0c4] font-mono">Qty: {item.quantity ?? 1}</p>
                    </div>
                    <CheckCircle size={13} className="text-[#1a6b3c] shrink-0" />
                  </div>
                ))}
                {items.length > 5 && (
                  <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e8edf3]">
                    <p className="text-[11px] text-[#9ab0c4]">+{items.length - 5} more products included</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <PDFDownloadLink
                document={<CatalogPDF company={company} products={items} />}
                fileName={`catalog-${company.slug || 'bpe'}-${new Date().toISOString().slice(0,10)}.pdf`}
              >
                {({ loading }) => (
                  <button
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#1a6b3c] hover:bg-[#155731] text-white text-[12px] font-600 uppercase tracking-wide transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    <Download size={14} />
                    {loading ? 'Generating PDF...' : 'Download PDF Catalog'}
                  </button>
                )}
              </PDFDownloadLink>

              <button
                onClick={() => router.push('/contact')}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#0b1f3a] hover:bg-[#1a3055] text-white text-[12px] font-600 uppercase tracking-wide transition-colors"
              >
                <Send size={14} />
                Submit Technical Inquiry
              </button>

              <Link
                href="/products"
                className="flex items-center justify-center gap-2 w-full py-3.5 border border-[#cdd5de] hover:border-[#0b1f3a] text-[#5a6e82] hover:text-[#0b1f3a] text-[12px] font-600 uppercase tracking-wide transition-colors"
              >
                Continue Exploring <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#9ab0c4] mt-4">
          Catalog reference saved. Our sales team will follow up within 24 business hours.
        </p>
      </div>
    </div>
  );
}