'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params?.candidateId as string;
  const [name, setName] = useState('');
  const [stack, setStack] = useState('Fullstack Javascript');
  const [resumeInput, setResumeInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !resumeInput || !candidateId) return;
    setLoading(true);

    try {
      const res = await fetch('/api/candidate/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          fullName: name,
          techStack: stack,
          resumeText: resumeInput,
        }),
      });

      const data = await res.json();
      setLoading(false);
      if (data.success) {
        router.push(`/interview/${candidateId}/personal`);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      setLoading(false);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Interview Portal</h1>
          <p className="text-xs text-zinc-400">Complete your setup to initiate the screening rounds</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full text-zinc-100"
              placeholder="John Doe"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Target Tech Stack</label>
            <select
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full text-zinc-100"
            >
              <option>Fullstack Javascript</option>
              <option>Python Developer</option>
              <option>Golang engineer</option>
              <option>Java backend developer</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Paste Resume Text</label>
            <textarea
              required
              rows={5}
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full resize-none text-zinc-100"
              placeholder="Paste the plain-text content of your resume here..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Processing...' : 'Begin Screening Interview'}
          </button>
        </form>
      </div>
    </div>
  );
}
