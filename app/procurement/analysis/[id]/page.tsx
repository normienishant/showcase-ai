// app/procurement/analysis/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, FileText, Building2, Calendar, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [extracted, setExtracted] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`${API_URL}/procurement/analysis/${id}`);
        const data = await res.json();
        if (data.extracted) {
          setExtracted(data.extracted);
          setSession(data.session);
        } else {
          toast.error(data.error || 'Analysis failed');
        }
      } catch (error) {
        toast.error('Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[#1a6b3c]" />
          <p className="text-[#5a6e82]">Analyzing document...</p>
        </div>
      </div>
    );
  }

  if (!extracted) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-[#5a6e82]">Could not extract data from this document.</p>
        <Link href="/procurement/upload" className="text-[#1a6b3c] hover:underline mt-4 inline-block">
          Try uploading again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1f3a]">AI Analysis</h1>
          <p className="text-sm text-[#5a6e82]">{session?.fileName}</p>
        </div>
        <Link
          href={`/procurement/boq/${id}`}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] text-white rounded hover:bg-[#155731] transition-colors"
        >
          Review BOQ <ArrowRight size={18} />
        </Link>
      </div>

      {/* Client Details */}
      {extracted.client && (
        <div className="bg-white border border-[#e8edf3] rounded-lg p-4 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0b1f3a] mb-2">
            <Building2 size={16} /> Client Details
          </h3>
          <p className="text-sm">{extracted.client.name || 'N/A'}</p>
          {extracted.client.address && <p className="text-xs text-[#5a6e82]">{extracted.client.address}</p>}
        </div>
      )}

      {/* Scope */}
      {extracted.scope && (
        <div className="bg-white border border-[#e8edf3] rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#0b1f3a] mb-2">Scope of Work</h3>
          <p className="text-sm text-[#5a6e82]">{extracted.scope}</p>
        </div>
      )}

      {/* Deadlines */}
      {extracted.deadlines && (extracted.deadlines.submission || extracted.deadlines.delivery) && (
        <div className="bg-white border border-[#e8edf3] rounded-lg p-4 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0b1f3a] mb-2">
            <Calendar size={16} /> Deadlines
          </h3>
          {extracted.deadlines.submission && <p className="text-sm">📅 Submission: {extracted.deadlines.submission}</p>}
          {extracted.deadlines.delivery && <p className="text-sm">📦 Delivery: {extracted.deadlines.delivery}</p>}
        </div>
      )}

      {/* Risks */}
      {extracted.risks && extracted.risks.length > 0 && (
        <div className="bg-white border border-[#e8edf3] rounded-lg p-4 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0b1f3a] mb-2">
            <AlertCircle size={16} /> Risks & Penalties
          </h3>
          <ul className="list-disc list-inside text-sm text-[#5a6e82]">
            {extracted.risks.map((risk: string, i: number) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment Terms */}
      {extracted.paymentTerms && (
        <div className="bg-white border border-[#e8edf3] rounded-lg p-4 mb-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0b1f3a] mb-2">
            <CreditCard size={16} /> Payment Terms
          </h3>
          <p className="text-sm text-[#5a6e82]">{extracted.paymentTerms}</p>
        </div>
      )}

      {/* BOQ Preview */}
      {extracted.boq && extracted.boq.length > 0 && (
        <div className="bg-white border border-[#e8edf3] rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-[#0b1f3a] mb-3">Bill of Quantities ({extracted.boq.length} items)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] border-b border-[#e8edf3]">
                <tr>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Item</th>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Qty</th>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Unit</th>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Rate</th>
                </tr>
              </thead>
              <tbody>
                {extracted.boq.slice(0, 5).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-[#e8edf3]">
                    <td className="px-3 py-2">{item.item || 'N/A'}</td>
                    <td className="px-3 py-2">{item.qty || 'N/A'}</td>
                    <td className="px-3 py-2">{item.unit || 'N/A'}</td>
                    <td className="px-3 py-2">{item.rate || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {extracted.boq.length > 5 && (
              <p className="text-xs text-[#9ab0c4] mt-2">+{extracted.boq.length - 5} more items</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href={`/procurement/boq/${id}`}
          className="flex items-center gap-2 px-6 py-2 bg-[#1a6b3c] text-white rounded hover:bg-[#155731] transition-colors"
        >
          Review & Edit BOQ <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}