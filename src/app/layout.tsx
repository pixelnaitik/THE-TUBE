import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Providers } from '@/components/Providers';

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f0f0f] text-white overflow-hidden`}>
        <Providers>
          <Navbar />
          <div className="flex h-screen pt-16">
            <Sidebar />
            <main className="flex-1 md:ml-64 overflow-y-auto bg-[#0f0f0f] p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
