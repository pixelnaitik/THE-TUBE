"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
      <h2 className="text-2xl font-bold text-white mb-3">Something went wrong!</h2>
      <p className="text-gray-400 mb-8 max-w-md">Try refreshing the page, or check back later. If the problem persists, please contact support.</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-[#272727] hover:bg-[#303030] text-white rounded-full font-medium transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
