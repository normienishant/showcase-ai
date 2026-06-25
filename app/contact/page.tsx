// app/contact/page.tsx — Lead Capture UI with fixed quantity
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Mail, Phone, Building2, MessageSquare, BookMarked, CheckCircle } from 'lucide-react';
import { useWishlist } from '@/store/wishlist';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function LeadCapturePage() {
  const { items } = useWishlist();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        const data = await api.getCompany('bpe');
        setCompany(data);
      } catch (error) {
        console.error('Failed to load company:', error);
        toast.error('Failed to load company data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      toast.error('Company data not loaded. Please refresh the page.');
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        message: form.message,
        wishlist_snapshot: items,
      };
      await api.submitLead(company.id, payload);
      toast.success('Inquiry submitted successfully!');
      router.push('/pdf-success');
    } catch (error: any) {
      console.error('Submit failed:', error);
      toast.error(error?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0b1f3a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#0b1f3a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[11px] text-[#1a6b3c] uppercase tracking-widest mb-2 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Sales & Technical Inquiry
          </p>
          <h1 className="text-[32px] text-white uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Submit Your Inquiry
          </h1>
          <p className="text-[13px] text-[#7a9cc8] mt-2">
            Our technical sales team will review your inquiry and respond within 24 business hours.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="border border-[#e8edf3] bg-white">
              <div className="bg-[#f2f5f8] border-b border-[#e8edf3] px-5 py-3">
                <p className="text-[12px] text-[#5a6e82] uppercase tracking-widest font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  Contact Information
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-1.5">
                      Full Name <span className="text-[#1a6b3c]">*</span>
                    </label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Rajesh Mehta"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#0b1f3a] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-1.5">
                      Email <span className="text-[#1a6b3c]">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="rajesh@company.in"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#0b1f3a] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-1.5">
                      Phone <span className="text-[#1a6b3c]">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#0b1f3a] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-1.5">
                      Company / Organisation
                    </label>
                    <div className="relative">
                      <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
                      <input
                        value={form.company}
                        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                        placeholder="InfraCorp Engineering Pvt. Ltd."
                        className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#0b1f3a] transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-600 text-[#0b1f3a] uppercase tracking-wide mb-1.5">
                    Technical Requirements / Message
                  </label>
                  <div className="relative">
                    <MessageSquare size={13} className="absolute left-3 top-3 text-[#9ab0c4]" />
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Please specify quantities, delivery location, required certifications, project timeline, or any special requirements..."
                      rows={5}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#f8fafc] border border-[#cdd5de] text-[13px] text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#0b1f3a] transition-colors resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#1a6b3c] hover:bg-[#155731] disabled:opacity-60 text-white text-[13px] font-600 uppercase tracking-wide transition-colors"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
                <p className="text-center text-[11px] text-[#9ab0c4]">
                  Your data is handled confidentially. We do not share contact information with third parties.
                </p>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {items.length > 0 && (
              <div className="border border-[#e8edf3] bg-white">
                <div className="bg-[#f2f5f8] border-b border-[#e8edf3] px-4 py-3">
                  <p className="text-[11px] text-[#5a6e82] uppercase tracking-widest flex items-center gap-2 font-600" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    <BookMarked size={11} className="text-[#1a6b3c]" /> Products of Interest
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 py-1.5 border-b border-[#f2f5f8] last:border-0">
                      <div className="w-8 h-8 bg-[#eef1f5] overflow-hidden shrink-0">
                        <img
                          src={item.images?.[0] || 'https://placehold.co/600x400/1a56db/white?text=No+Image'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#0b1f3a] font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>
                          {item.name}
                        </p>
                        <p className="text-[9px] text-[#9ab0c4] font-mono">Qty: {item.quantity ?? 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border border-[#1a6b3c]/30 bg-[#1a6b3c]/5 p-4">
              <p className="text-[12px] text-[#0b1f3a] mb-3 uppercase tracking-wide font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Our Commitment
              </p>
              {[
                'Technical response within 24 hours',
                'Factory test reports on request',
                'Site visit possible for large orders',
                'Competitive pricing guaranteed',
              ].map((c) => (
                <div key={c} className="flex items-center gap-2 mb-2">
                  <CheckCircle size={12} className="text-[#1a6b3c] shrink-0" />
                  <span className="text-[12px] text-[#5a6e82]">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}