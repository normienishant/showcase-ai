// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import TrackingProvider from "@/components/TrackingProvider";
import AIAdvisor from "@/components/AIAdvisor";
import { headers } from 'next/headers';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-display", 
  weight: ["500", "600", "700", "800"] 
});

export const metadata: Metadata = {
  title: "BPE - Product Catalog | Showcase AI",
  description: "Interactive product catalog for Best Power Equipments",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // ─── Hide AI Advisor on admin & procurement routes ───
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/procurement');

  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
        <TrackingProvider />
        {children}
        <Toaster position="top-right" richColors />
        {/* AI Advisor only on non-admin pages */}
        {!isAdminRoute && <AIAdvisor />}
      </body>
    </html>
  );
}