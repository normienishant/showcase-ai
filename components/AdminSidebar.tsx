// components/AdminSidebar.tsx
'use client';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, FolderTree, Users, Settings, LogOut,
  Activity, FileText, ChevronRight
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'visitors', label: 'Visitors', icon: Activity },
  { id: 'branding', label: 'Branding', icon: Settings },
  { id: 'procurement', label: 'Procurement', icon: FileText },
];

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (itemId: string) => {
    if (itemId === 'procurement' && pathname?.startsWith('/procurement')) return true;
    return activeTab === itemId;
  };

  return (
    <aside className="hidden lg:flex w-56 bg-[#0b1f3a] text-white flex-col shrink-0 h-screen sticky top-0">
      <div className="h-14 flex items-center px-4 border-b border-[#1f3a5c]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1a6b3c] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7V13L10 18L18 13V7L10 2Z" fill="#1a6b3c"/>
              <path d="M10 6L6 8.5V12.5L10 15L14 12.5V8.5L10 6Z" fill="white"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] uppercase tracking-wide leading-none font-700" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Showcase AI</p>
            <p className="text-[8px] text-[#44617a] uppercase tracking-widest leading-none mt-0.5">Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {menuItems.map(item => {
          const active = isActive(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 text-[12px] font-600 uppercase tracking-wide border-l-2 transition-all w-full text-left ${
                active
                  ? 'border-[#1a6b3c] bg-[#1a6b3c]/10 text-white'
                  : 'border-transparent text-[#7a9cc8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={14} />
              {item.label}
              {active && <ChevronRight size={10} className="ml-auto text-[#1a6b3c]" />}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-[#1f3a5c] py-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-600 uppercase tracking-wide text-[#44617a] hover:text-red-400 transition-colors"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </aside>
  );
}