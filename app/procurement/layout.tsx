// app/procurement/layout.tsx
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, AlertTriangle, X } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ProcurementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // ── Confirmation modal state ──
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      setIsAuthenticated(false);
    }
  }, [router]);

  const isInSession = () => {
    return /\/procurement\/(boq|po|analysis)\//.test(pathname || '');
  };

  const handleTabChange = (tab: string) => {
    // If we're not in a session, just navigate
    if (!isInSession()) {
      navigateToTab(tab);
      return;
    }

    // If we're trying to leave procurement or go to dashboard
    if (tab !== 'procurement' || (tab === 'procurement' && isInSession())) {
      // Show custom modal
      setPendingTab(tab);
      setShowConfirm(true);
      return;
    }

    navigateToTab(tab);
  };

  const navigateToTab = (tab: string) => {
    if (tab === 'procurement') {
      router.push('/procurement');
    } else {
      router.push(`/admin?tab=${tab}`);
    }
  };

  const handleConfirmLeave = () => {
    setShowConfirm(false);
    if (pendingTab) {
      navigateToTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleCancelLeave = () => {
    setShowConfirm(false);
    setPendingTab(null);
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

      {/* ─── Custom Confirmation Modal ─── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md p-6 shadow-xl border-0 bg-white rounded-xl">
          <DialogHeader className="flex flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-[18px] font-bold text-[#0b1f3a]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                Unsaved Changes
              </DialogTitle>
              <DialogDescription className="text-sm text-[#5a6e82] mt-1 leading-relaxed">
                You are in the middle of creating a BOQ or PO. If you leave now, your progress will be lost.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelLeave}
              className="flex-1 border-[#cdd5de] text-[#5a6e82] hover:bg-[#f2f5f8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLeave}
              className="flex-1 bg-[#b45309] hover:bg-[#92400e] text-white"
            >
              Leave Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}