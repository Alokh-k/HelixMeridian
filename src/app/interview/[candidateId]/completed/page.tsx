'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function Completed() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Interview Submitted</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your screening sessions have been successfully cataloged and processed. The HR team will review your transcripts and scorecard shortly.
          </p>
        </div>
        <p className="text-xs text-zinc-600">You may close this browser tab.</p>
      </div>
    </div>
  );
}
