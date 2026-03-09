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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 md:py-0">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-xl md:p-8">
        <div className="mb-6 flex flex-col items-center md:mb-8">
          <Link href="/" className="mb-4 flex items-center gap-2 md:mb-6">
            <div className="rounded-xl bg-red-600 p-2 text-white shadow-lg shadow-red-600/25">
              <Video className="h-6 w-6 fill-current md:h-8 md:w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-[var(--foreground)] md:text-3xl">MyTube</span>
          </Link>

          <div className="glass-chip mb-4 flex w-full rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-md' : 'text-muted hover:text-[var(--foreground)]'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-[var(--surface-3)] text-[var(--foreground)] shadow-md' : 'text-muted hover:text-[var(--foreground)]'}`}
            >
              Sign Up
            </button>
          </div>

          <p className="text-center text-sm text-muted">
            {mode === 'signin'
              ? 'Welcome back! Sign in to your account.'
              : 'Create a new account to upload videos.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-3 text-[var(--foreground)] outline-none focus:border-blue-500"
                placeholder="Your display name"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full rounded-lg px-4 py-3 text-[var(--foreground)] outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full rounded-lg px-4 py-3 text-[var(--foreground)] outline-none focus:border-blue-500"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? (mode === 'signin' ? "Signing in..." : "Creating account...")
              : (mode === 'signin' ? "Sign In" : "Create Account")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === 'signin' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }} className="font-medium text-blue-500 hover:underline">
                Sign Up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(''); }} className="font-medium text-blue-500 hover:underline">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
