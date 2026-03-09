import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from '@/components/ScrollToTop';
import MobileBottomNav from '@/components/MobileBottomNav';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} bg-[#0f0f0f] text-white overflow-x-hidden transition-colors duration-200`}>
        <Providers>
          <Toaster
            position="bottom-left"
            toastOptions={{
              style: { background: '#333', color: '#fff' },
            }}
          />
          <Navbar />
          <div className="mt-14 flex h-[calc(100dvh-56px)] pb-14 md:pb-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-[#0f0f0f] p-3 sm:p-5 md:ml-20 lg:ml-56 lg:p-8 transition-colors duration-200">
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