// app/admin/login/page.tsx — Figma UI
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@bpe.com');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.adminLogin(email, password);
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        toast.success('Login successful!');
        router.push('/admin'); // ✅ Fixed: /admin not /admin/dashboard
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f3a] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-10 border-r border-[#1f3a5c]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a6b3c] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" fill="#1a6b3c"/>
              <path d="M10 6L6 8.5V12.5L10 15L14 12.5V8.5L10 6Z" fill="white"/>
            </svg>
          </div>
          <div>
            <p className="text-[18px] text-white uppercase tracking-wide font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Showcase AI
            </p>
            <p className="text-[9px] text-[#44617a] uppercase tracking-widest">Admin Portal</p>
          </div>
        </div>

        <div>
          <h2 className="text-[38px] text-white uppercase leading-tight mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
            Manage Your<br />
            Product<br />
            <span className="text-[#1a6b3c]">Experience.</span>
          </h2>
          <p className="text-[13px] text-[#7a9cc8] leading-relaxed mb-8 max-w-xs">
            Upload and manage products, track sales leads, generate reports, and customize your catalog platform branding.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: '120+', l: 'Products' },
              { v: '48', l: 'Leads this month' },
              { v: '230', l: 'PDF downloads' },
              { v: '99.9%', l: 'Platform uptime' },
            ].map(s => (
              <div key={s.l} className="border border-[#1f3a5c] p-4">
                <p className="text-[24px] text-white font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.v}</p>
                <p className="text-[11px] text-[#44617a] mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#2a4f7a]">© 2026 Showcase AI · Admin Portal v2.0</p>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-[#1a6b3c] flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[16px] text-white uppercase tracking-wide font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Showcase AI</p>
              <p className="text-[9px] text-[#44617a] uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>

          <div className="border border-[#1f3a5c] bg-[#0d1e30]">
            <div className="border-b border-[#1f3a5c] px-6 py-4">
              <h1 className="text-[20px] text-white uppercase font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Administrator Sign In
              </h1>
              <p className="text-[12px] text-[#7a9cc8] mt-0.5">Enter any password to access demo</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-600 text-[#7a9cc8] uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44617a]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0b1f3a] border border-[#1f3a5c] text-[13px] text-white placeholder-[#44617a] outline-none focus:border-[#1a6b3c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-600 text-[#7a9cc8] uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44617a]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter any password"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#0b1f3a] border border-[#1f3a5c] text-[13px] text-white placeholder-[#44617a] outline-none focus:border-[#1a6b3c] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44617a] hover:text-[#7a9cc8]"
                  >
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a6b3c] hover:bg-[#155731] disabled:opacity-60 text-white text-[12px] font-600 uppercase tracking-wide transition-colors mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={13} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}