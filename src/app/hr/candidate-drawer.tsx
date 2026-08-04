'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  candidate: any;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
}

export default function CandidateDrawer({ candidate, onClose, onStatusChange }: DrawerProps) {
  const report = candidate.evaluationReport as any;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto text-zinc-100 z-50 transition-transform duration-300">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">{candidate.fullName || 'No Name'}</h2>
          <p className="text-sm text-zinc-400">{candidate.email}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Action buttons */}
        <div className="flex space-x-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <button
            onClick={() => onStatusChange('SHORTLISTED')}
            className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold text-white transition"
          >
            Shortlist Candidate
          </button>
          <button
            onClick={() => onStatusChange('REJECTED')}
            className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-500 rounded-lg font-semibold text-white transition"
          >
            Reject Candidate
          </button>
        </div>

        {/* AI Score */}
        {candidate.evaluationScore !== null && candidate.evaluationScore !== undefined && (
          <div className="p-5 bg-gradient-to-br from-indigo-900/40 to-zinc-900 rounded-xl border border-indigo-500/20">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Overall AI Score</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-extrabold text-indigo-300">{candidate.evaluationScore}</span>
              <span className="text-zinc-500 text-lg">/ 100</span>
            </div>
            {report && <p className="mt-3 text-sm text-zinc-300 italic">"{report.summary}"</p>}
          </div>
        )}

        {/* Detailed Scorecard */}
        {report && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <h4 className="font-semibold text-emerald-400 mb-2 text-sm">Strengths</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-300">
                {report.strengths?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
              </ul>
            </div>
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <h4 className="font-semibold text-rose-400 mb-2 text-sm">Areas of Improvement</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-300">
                {report.weaknesses?.map((w: string, idx: number) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Transcripts */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase text-zinc-400 border-b border-zinc-800 pb-1">Interview Logs</h3>
          
          <details className="group border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
            <summary className="p-4 cursor-pointer hover:bg-zinc-850 font-medium flex justify-between items-center text-sm">
              <span>Personal Round Transcript</span>
              <span className="text-xs text-zinc-500">View dialogues</span>
            </summary>
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 space-y-3 text-xs max-h-60 overflow-y-auto">
              {(candidate.personalTranscript as any[])?.map((t: any, idx: number) => (
                <div key={idx} className={`p-2 rounded-lg ${t.role === 'interviewer' ? 'bg-zinc-900 border-l-4 border-indigo-500' : 'bg-zinc-800 text-right ml-10'}`}>
                  <p className="font-semibold text-zinc-400 mb-1">{t.role.toUpperCase()}</p>
                  <p className="text-zinc-200">{t.text}</p>
                </div>
              ))}
            </div>
          </details>

          <details className="group border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
            <summary className="p-4 cursor-pointer hover:bg-zinc-850 font-medium flex justify-between items-center text-sm">
              <span>Technical Round Transcript</span>
              <span className="text-xs text-zinc-500">View dialogues</span>
            </summary>
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 space-y-3 text-xs max-h-60 overflow-y-auto">
              {(candidate.technicalTranscript as any[])?.map((t: any, idx: number) => (
                <div key={idx} className={`p-2 rounded-lg ${t.role === 'interviewer' ? 'bg-zinc-900 border-l-4 border-emerald-500' : 'bg-zinc-800 text-right ml-10'}`}>
                  <p className="font-semibold text-zinc-400 mb-1">{t.role.toUpperCase()}</p>
                  <p className="text-zinc-200">{t.text}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
