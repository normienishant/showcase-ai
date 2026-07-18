// app/procurement/layout.tsx
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useEffect, useState } from 'react';

export default function ProcurementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      setIsAuthenticated(false);
    }
  }, [router]);

  const isInSession = () => {
    // Check if we're on a BOQ, PO, or Analysis page (i.e., in the middle of a session)
    return /\/procurement\/(boq|po|analysis)\//.test(pathname || '');
  };

  const handleTabChange = (tab: string) => {
    // If trying to leave procurement while in a session
    if (tab !== 'procurement' && isInSession()) {
      const confirmLeave = window.confirm(
        'You are in the middle of creating a BOQ/PO. Are you sure you want to leave? Unsaved changes will be lost.'
      );
      if (!confirmLeave) return;
    }

    // If going to procurement (dashboard) from a session page, we also want to confirm
    if (tab === 'procurement' && isInSession()) {
      const confirmLeave = window.confirm(
        'You are in the middle of creating a BOQ/PO. Are you sure you want to go to the dashboard? Unsaved changes will be lost.'
      );
      if (!confirmLeave) return;
      router.push('/procurement');
      return;
    }

    if (tab === 'procurement') {
      router.push('/procurement');
    } else {
      router.push(`/admin?tab=${tab}`);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex">
      <AdminSidebar activeTab="procurement" onTabChange={handleTabChange} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#e8edf3] flex items-center justify-between px-5 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-700 uppercase text-[#0b1f3a]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Procurement
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#1a6b3c] rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#e8edf3]">
              <div className="w-7 h-7 bg-[#0b1f3a] flex items-center justify-center">
                <span className="text-white text-[10px] font-700">A</span>
              </div>
              <span className="hidden sm:block text-[12px] font-600 text-[#0b1f3a]">Administrator</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}