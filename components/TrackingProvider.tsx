// components/TrackingProvider.tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/tracking';

export default function TrackingProvider() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);
  return null;
}