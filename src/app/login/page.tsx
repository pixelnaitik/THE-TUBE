"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === 'signup') {
      // Call signup API first
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        setError(signupData.error || "Signup failed");
        setLoading(false);
        return;
      }
    }

    // Sign in with credentials
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(mode === 'signup' ? "Account created but login failed. Try signing in." : "Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="max-w-md w-full bg-[#121212] border border-[#303030] p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="bg-red-600 text-white p-2 rounded-xl">
              <Video className="w-8 h-8 fill-current" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-white">MyTube</span>
          </Link>

          {/* Tab Switcher */}
          <div className="flex w-full bg-[#0f0f0f] rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-[#272727] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-[#272727] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Sign Up
            </button>
          </div>

          <p className="text-[#AAAAAA] text-sm text-center">
            {mode === 'signin'
              ? 'Welcome back! Sign in to your account.'
              : 'Create a new account to upload videos.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#222] border border-[#303030] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Your display name"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#222] border border-[#303030] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#222] border border-[#303030] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg mt-4 transition-colors disabled:opacity-50"
          >
            {loading
              ? (mode === 'signin' ? "Signing in..." : "Creating account...")
              : (mode === 'signin' ? "Sign In" : "Create Account")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'signin' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }} className="text-blue-500 hover:underline font-medium">
                Sign Up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(''); }} className="text-blue-500 hover:underline font-medium">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
