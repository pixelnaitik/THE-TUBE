import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from '@/components/ScrollToTop';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'MyTube - Video Platform',
  description: 'A modern video publishing and streaming platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="overflow-x-hidden bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Providers>
          <Toaster
            position="bottom-left"
            toastOptions={{
              style: { background: 'var(--surface-2)', color: 'var(--foreground)', border: '1px solid var(--line)' },
            }}
          />
          <Navbar />
          <div className="mt-14 flex h-[calc(100dvh-56px)] pb-16 md:pb-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-3 transition-colors duration-200 sm:p-5 md:ml-20 lg:ml-56 lg:p-8">
              {children}
            </main>
          </div>
          <MobileBottomNav />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
