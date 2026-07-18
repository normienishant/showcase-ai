// app/procurement/upload/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, File } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'test'); // Replace with actual user later

    try {
      const res = await fetch(`${API_URL}/procurement/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.session) {
        toast.success('File uploaded successfully');
        router.push(`/procurement/analysis/${data.session.id}`);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0b1f3a] mb-6">Upload RFQ / Tender</h1>
        <div
          className="border-2 border-dashed border-[#cdd5de] rounded-lg p-12 text-center hover:border-[#1a6b3c] transition-colors bg-white"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload size={48} className="text-[#9ab0c4] mx-auto mb-4" />
              <p className="text-[#5a6e82]">Drag & drop your RFQ or tender file here</p>
              <p className="text-sm text-[#9ab0c4] mt-1">Supports PDF, Word (.docx), and text files</p>
              <label className="mt-4 inline-block px-4 py-2 bg-[#0b1f3a] text-white rounded cursor-pointer hover:bg-[#1a3055]">
                Choose File
                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.doc,.txt" />
              </label>
            </>
          ) : (
            <div className="flex items-center justify-between bg-[#f8fafc] p-4 rounded border border-[#e8edf3]">
              <div className="flex items-center gap-3">
                <File size={24} className="text-[#1a6b3c]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#0b1f3a]">{file.name}</p>
                  <p className="text-xs text-[#9ab0c4]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-[#9ab0c4] hover:text-red-500">
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full py-3 bg-[#1a6b3c] text-white rounded-lg hover:bg-[#155731] disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload & Analyze'}
        </button>
      </div>
    </div>
  );
}