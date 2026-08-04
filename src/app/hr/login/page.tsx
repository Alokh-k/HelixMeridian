'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function HrLogin() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/hr/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        router.push('/hr');
      } else {
        setError(data.error || 'Failed to authenticate');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">HR Portal Access</h1>
          <p className="text-xs text-zinc-400">Enter the administration passcode to manage candidate files</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-zinc-400" htmlFor="passcode-input">Passcode</label>
            <input
              id="passcode-input"
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 w-full text-zinc-100"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-semibold text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
