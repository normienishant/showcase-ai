// components/LeadCaptureModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getVisitorId, getSessionId } from '@/lib/tracking';

interface LeadCaptureModalProps {
  companyId: string;
  onSuccess: () => void;
}

export default function LeadCaptureModal({ companyId, onSuccess }: LeadCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const hasSubmitted = localStorage.getItem('lead_captured');
    if (!hasSubmitted) {
      setIsOpen(true);
    }
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Name: only letters, spaces, dots, hyphens
    const nameRegex = /^[a-zA-Z\s\.\-]+$/;
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!nameRegex.test(form.name)) {
      newErrors.name = 'Name can only contain letters, spaces, dots and hyphens';
    }
    // Phone: exactly 10 digits
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[0-9]{10}$/.test(phoneDigits)) {
      newErrors.phone = 'Phone number must contain only digits';
    }
    // Email: optional but if provided, must be valid
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      await api.submitLead(companyId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        message: 'Lead captured via mandatory entry modal',
        visitorId,
        sessionId,
      });

      localStorage.setItem('lead_captured', 'true');
      localStorage.setItem('lead_name', form.name);
      localStorage.setItem('lead_phone', form.phone);

      toast.success('Thank you! You can now browse the catalog.');
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const value = e.target.value.replace(/\D/g, '');
    setForm({ ...form, phone: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#0b1f3a] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" fill="#1a6b3c" stroke="none"/>
              <path d="M10 6L6 8.5V12.5L10 15L14 12.5V8.5L10 6Z" fill="white" stroke="none"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0b1f3a]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Get Your Personalized Catalog
          </h2>
          <p className="text-sm text-[#5a6e82] mt-2">
            We'll send you a customised brochure and connect you with our experts. No spam, just helpful information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5a6e82] uppercase tracking-wide mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-[#0b1f3a] placeholder-[#9ab0c4] outline-none transition-colors bg-[#f8fafc] ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#cdd5de] focus:border-[#1a6b3c]'
                }`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a6e82] uppercase tracking-wide mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
              <input
                required
                type="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                maxLength={10}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-[#0b1f3a] placeholder-[#9ab0c4] outline-none transition-colors bg-[#f8fafc] ${
                  errors.phone ? 'border-red-500 focus:border-red-500' : 'border-[#cdd5de] focus:border-[#1a6b3c]'
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a6e82] uppercase tracking-wide mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-[#0b1f3a] placeholder-[#9ab0c4] outline-none transition-colors bg-[#f8fafc] ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-[#cdd5de] focus:border-[#1a6b3c]'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a6e82] uppercase tracking-wide mb-1">
              Company / Organisation
            </label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ab0c4]" />
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Your company name"
                className="w-full pl-10 pr-4 py-2.5 border border-[#cdd5de] rounded-lg text-sm text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#1a6b3c] transition-colors bg-[#f8fafc]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a6b3c] hover:bg-[#155731] text-white text-sm font-600 uppercase tracking-wide rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Continue to Catalog
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#9ab0c4] mt-2">
            We respect your privacy. Your details will only be used to send you relevant information.
          </p>
        </form>
      </div>
    </div>
  );
}