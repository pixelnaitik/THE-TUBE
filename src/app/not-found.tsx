import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <SearchX className="w-20 h-20 text-gray-600 mb-6" />
      <h2 className="text-2xl font-bold text-white mb-3">This page isn&apos;t available.</h2>
      <p className="text-gray-400 mb-8">Sorry about that. Try searching for something else.</p>
      <Link href="/" className="px-6 py-2.5 border border-[#303030] hover:bg-[#272727] text-white rounded-full font-medium transition-colors">
        Go to Home
      </Link>
    </div>
  );
}
