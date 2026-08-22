'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin/leads';
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#0f4f0f 1px, transparent 1px), linear-gradient(90deg, #0f4f0f 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="border border-green-800/50 bg-black/90 backdrop-blur p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="inline-block px-3 py-1 border border-yellow-600/50 bg-yellow-900/10 mb-4">
              <span className="text-yellow-400 font-mono text-xs tracking-widest">{'// SECURE_AREA'}</span>
            </div>
            <h1 className="text-2xl font-bold text-green-400 font-mono tracking-wider mb-2">
              ADMIN CONSOLE
            </h1>
            <p className="text-gray-500 text-sm font-mono">Authentication required</p>
          </div>

          {error && (
            <div className="mb-6 p-3 border border-red-700/50 bg-red-900/20 text-red-400 font-mono text-sm">
              {'> ERROR: '} {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-green-600 font-mono text-xs mb-2 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-green-800 text-green-400 font-mono px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="admin"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-green-600 font-mono text-xs mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-green-800 text-green-400 font-mono px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600/20 border border-green-500 text-green-400 font-mono font-bold tracking-wider hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'AUTHENTICATING...' : '> ACCESS SYSTEM'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-700 text-xs font-mono">
              {'// SESSION: '} ENCRYPTED
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-green-600 font-mono animate-pulse">INITIALIZING_SECURE_CHANNEL...</div>
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  );
}
