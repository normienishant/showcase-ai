// app/procurement/po/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function POPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [poData, setPoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [vendor, setVendor] = useState('');
  const router = useRouter();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchPOData = async () => {
      try {
        const res = await fetch(`${API_URL}/procurement/sessions/${id}`);
        if (!res.ok) throw new Error('Session not found');
        const session = await res.json();

        const boq = session.boqData || session.extractedData?.boq || [];
        const total = boq.reduce((sum: number, item: any) => {
          const rate = parseFloat(String(item.rate).replace(/[₹,]/g, '')) || 0;
          const qty = parseFloat(String(item.qty)) || 0;
          return sum + (rate * qty);
        }, 0);

        // ✅ FIX: Convert Date.now() to string before slice
        const poNumber = `PO-${String(Date.now()).slice(-6)}`;

        setPoData({
          poNumber: poNumber,
          items: boq,
          totalAmount: total,
          date: new Date().toISOString().slice(0, 10),
          status: 'draft',
        });
        setVendor(session.extractedData?.client?.name || 'Vendor');
      } catch (error) {
        console.error('PO data fetch error:', error);
        toast.error('Failed to load PO data');
        setPoData(null); // Ensure we show "No data" state
      } finally {
        setLoading(false);
      }
    };

    fetchPOData();
  }, [id]);

  const handleCreatePO = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/procurement/po/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor }),
      });
      if (!res.ok) throw new Error('Failed to create PO');
      await res.json();
      toast.success('Purchase Order created successfully!');
      router.push('/procurement');
    } catch (error) {
      toast.error('Failed to create PO');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-[#1a6b3c]" />
      </div>
    );
  }

  if (!poData) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <FileText size={48} className="text-[#cdd5de] mx-auto mb-4" />
        <p className="text-[#5a6e82]">No PO data available.</p>
        <Link href="/procurement" className="text-[#1a6b3c] hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1f3a]">Create Purchase Order</h1>
          <p className="text-sm text-[#5a6e82]">Review and confirm the purchase order</p>
        </div>
        <Link
          href={`/procurement/boq/${id}`}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#cdd5de] text-[#5a6e82] hover:bg-[#f2f5f8] rounded transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to BOQ
        </Link>
      </div>

      <div className="bg-white border border-[#e8edf3] rounded-lg p-6 space-y-6">
        {/* PO Header */}
        <div className="flex justify-between items-start border-b border-[#e8edf3] pb-4">
          <div>
            <p className="text-xs text-[#5a6e82] uppercase tracking-wider">Purchase Order</p>
            <p className="text-xl font-bold text-[#0b1f3a]">{poData.poNumber}</p>
            <p className="text-sm text-[#5a6e82]">Date: {poData.date}</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full">
            {poData.status}
          </span>
        </div>

        {/* Vendor */}
        <div>
          <label className="text-xs font-medium text-[#5a6e82] uppercase tracking-wider">Vendor</label>
          <input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-[#cdd5de] rounded-lg text-sm focus:outline-none focus:border-[#0b1f3a]"
          />
        </div>

        {/* Items */}
        <div>
          <p className="text-sm font-medium text-[#0b1f3a] mb-3">Items ({poData.items.length})</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#e8edf3]">
              <thead className="bg-[#f8fafc] border-b border-[#e8edf3]">
                <tr>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Item</th>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Qty</th>
                  <th className="px-3 py-2 text-left text-[#5a6e82]">Unit</th>
                  <th className="px-3 py-2 text-right text-[#5a6e82]">Rate</th>
                  <th className="px-3 py-2 text-right text-[#5a6e82]">Total</th>
                </tr>
              </thead>
              <tbody>
                {poData.items.map((item: any, idx: number) => {
                  const rate = parseFloat(String(item.rate).replace(/[₹,]/g, '')) || 0;
                  const qty = parseFloat(String(item.qty)) || 0;
                  const total = rate * qty;
                  return (
                    <tr key={idx} className="border-b border-[#e8edf3]">
                      <td className="px-3 py-2">{item.item || 'N/A'}</td>
                      <td className="px-3 py-2">{item.qty || 0}</td>
                      <td className="px-3 py-2">{item.unit || ''}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{rate.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{total.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#f8fafc]">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right font-semibold text-[#0b1f3a]">Total Amount</td>
                  <td className="px-3 py-2 text-right font-bold text-[#0b1f3a]">₹{poData.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#e8edf3]">
          <Link
            href={`/procurement/boq/${id}`}
            className="px-4 py-2 border border-[#cdd5de] text-[#5a6e82] hover:bg-[#f2f5f8] rounded transition-colors text-sm"
          >
            Back
          </Link>
          <button
            onClick={handleCreatePO}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-2 bg-[#1a6b3c] text-white rounded hover:bg-[#155731] transition-colors text-sm disabled:opacity-60"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {creating ? 'Creating...' : 'Confirm & Create PO'}
          </button>
        </div>
      </div>
    </div>
  );
}