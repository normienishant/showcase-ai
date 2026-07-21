// app/procurement/boq/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, ArrowRight, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import ProcurementAICopilot from '@/components/ProcurementAICopilot';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BOQPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [boqData, setBoqData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchBOQ = async () => {
      try {
        const res = await fetch(`${API_URL}/procurement/boq/${id}`);
        if (!res.ok) throw new Error('Failed to load BOQ');
        const data = await res.json();
        setBoqData(data.boqData || []);
      } catch (error) {
        console.error('BOQ fetch error:', error);
        toast.error('Failed to load BOQ');
      } finally {
        setLoading(false);
      }
    };

    fetchBOQ();
  }, [id]);

  const handleCellChange = (index: number, field: string, value: string) => {
    const updated = [...boqData];
    updated[index] = { ...updated[index], [field]: value };
    setBoqData(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/procurement/boq/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boqData }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('BOQ saved successfully!');
      router.push(`/procurement/po/${id}`);
    } catch (error) {
      toast.error('Failed to save BOQ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-[#1a6b3c]" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0">
      {/* Main BOQ Grid */}
      <div className={`flex-1 min-w-0 transition-all ${isCopilotOpen ? 'pr-0' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1f3a]">Edit BOQ</h1>
            <p className="text-sm text-[#5a6e82]">Review and adjust the Bill of Quantities</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded transition-colors text-sm ${
                isCopilotOpen
                  ? 'border-[#1a6b3c] text-[#1a6b3c] bg-[#1a6b3c]/5'
                  : 'border-[#cdd5de] text-[#5a6e82] hover:bg-[#f2f5f8]'
              }`}
            >
              <MessageCircle size={16} />
              {isCopilotOpen ? 'Hide AI' : 'Show AI'}
            </button>
            <Link
              href={`/procurement/analysis/${id}`}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#cdd5de] text-[#5a6e82] hover:bg-[#f2f5f8] rounded transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Back
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a6b3c] text-white rounded hover:bg-[#155731] transition-colors text-sm disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>

        {boqData.length === 0 ? (
          <div className="bg-white border border-[#e8edf3] p-8 text-center text-[#5a6e82]">
            No BOQ items found.
          </div>
        ) : (
          <div className="bg-white border border-[#e8edf3] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc] border-b border-[#e8edf3]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#5a6e82] font-medium">Item</th>
                    <th className="px-4 py-3 text-left text-[#5a6e82] font-medium">Qty</th>
                    <th className="px-4 py-3 text-left text-[#5a6e82] font-medium">Unit</th>
                    <th className="px-4 py-3 text-left text-[#5a6e82] font-medium">Rate</th>
                    <th className="px-4 py-3 text-left text-[#5a6e82] font-medium">Spec</th>
                  </tr>
                </thead>
                <tbody>
                  {boqData.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#e8edf3] hover:bg-[#f8fafc]">
                      <td className="px-4 py-2.5">
                        <input
                          value={item.item || ''}
                          onChange={(e) => handleCellChange(idx, 'item', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-[#cdd5de] focus:border-[#0b1f3a] px-2 py-1 rounded outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={item.qty || ''}
                          onChange={(e) => handleCellChange(idx, 'qty', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-[#cdd5de] focus:border-[#0b1f3a] px-2 py-1 rounded outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={item.unit || ''}
                          onChange={(e) => handleCellChange(idx, 'unit', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-[#cdd5de] focus:border-[#0b1f3a] px-2 py-1 rounded outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={item.rate || ''}
                          onChange={(e) => handleCellChange(idx, 'rate', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-[#cdd5de] focus:border-[#0b1f3a] px-2 py-1 rounded outline-none transition-colors"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={item.spec || ''}
                          onChange={(e) => handleCellChange(idx, 'spec', e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-[#cdd5de] focus:border-[#0b1f3a] px-2 py-1 rounded outline-none transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Link
            href={`/procurement/analysis/${id}`}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#cdd5de] text-[#5a6e82] hover:bg-[#f2f5f8] rounded transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Analysis
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2 bg-[#1a6b3c] text-white rounded hover:bg-[#155731] transition-colors text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {saving ? 'Saving...' : 'Save & Continue to PO'}
          </button>
        </div>
      </div>

      {/* AI Copilot Sidebar */}
      {isCopilotOpen && id && (
        <ProcurementAICopilot
          sessionId={id}
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      )}
    </div>
  );
}