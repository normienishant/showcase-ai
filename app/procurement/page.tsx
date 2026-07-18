// app/procurement/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProcurementDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/procurement/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    uploaded: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    analyzing: 'bg-blue-100 text-blue-700 border-blue-200',
    analysis_done: 'bg-green-100 text-green-700 border-green-200',
    boq_editing: 'bg-purple-100 text-purple-700 border-purple-200',
    boq_done: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    po_created: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const statusLabels: Record<string, string> = {
    uploaded: 'Uploaded',
    analyzing: 'Analyzing',
    analysis_done: 'Analysis Done',
    boq_editing: 'Editing BOQ',
    boq_done: 'BOQ Done',
    po_created: 'PO Created',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1f3a]">Procurement Dashboard</h1>
          <p className="text-sm text-[#5a6e82]">AI-powered RFQ/Tender processing</p>
        </div>
        <Link
          href="/procurement/upload"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a6b3c] text-white rounded hover:bg-[#155731] transition-colors"
        >
          <Plus size={18} /> New Upload
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#e8edf3] rounded-lg">
          <FileText size={48} className="text-[#cdd5de] mx-auto mb-4" />
          <p className="text-[#5a6e82]">No procurement sessions yet.</p>
          <Link href="/procurement/upload" className="text-[#1a6b3c] hover:underline mt-2 inline-block">
            Upload your first RFQ/Tender
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#e8edf3] rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-[#f8fafc] border-b border-[#e8edf3]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#5a6e82]">File</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#5a6e82]">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#5a6e82]">Uploaded</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#5a6e82]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-[#e8edf3] hover:bg-[#f8fafc]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#9ab0c4]" />
                      <span className="text-sm text-[#0b1f3a]">{session.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[session.status] || 'bg-gray-100'}`}>
                      {statusLabels[session.status] || session.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5a6e82]">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/procurement/analysis/${session.id}`}
                      className="text-sm text-[#1a6b3c] hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}