'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CodingRound() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params?.candidateId as string;
  const [question, setQuestion] = useState<any>(null);
  const [code, setCode] = useState('');
  const [runResults, setRunResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const getQuestion = async () => {
      if (!candidateId) return;
      try {
        const res = await fetch('/api/interview/coding/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        });
        const data = await res.json();
        if (data.question) {
          setQuestion(data.question);
          setCode(data.question.starterCode || '');
        }
      } catch (e) {
        console.error(e);
      }
    };
    getQuestion();
  }, [candidateId]);

  const runCode = async () => {
    if (!candidateId) return;
    setRunning(true);
    try {
      const res = await fetch('/api/interview/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, code }),
      });
      const data = await res.json();
      setRunning(false);
      if (data.results) {
        setRunResults(data.results);
      }
    } catch (e) {
      setRunning(false);
      console.error(e);
    }
  };

  const submitInterview = async () => {
    if (!candidateId) return;
    setSubmitting(true);
    try {
      await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      setSubmitting(false);
      router.push(`/interview/${candidateId}/completed`);
    } catch (e) {
      setSubmitting(false);
      console.error(e);
    }
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans">
        <p className="text-zinc-400">Loading coding challenge...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="h-14 border-b border-zinc-900 px-6 flex justify-between items-center bg-zinc-900/50">
        <div>
          <h1 className="font-bold text-white text-sm">Round 3: Interactive Coding Challenge</h1>
        </div>
        <button
          onClick={submitInterview}
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Finish & Submit Interview'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Question panel */}
        <div className="w-1/2 p-6 border-r border-zinc-900 overflow-y-auto space-y-6">
          <h2 className="text-lg font-bold text-zinc-100">{question.title}</h2>
          <div className="prose prose-invert text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
            {question.description}
          </div>

          {/* Test outputs */}
          <div className="space-y-3 pt-6 border-t border-zinc-900">
            <h3 className="text-xs font-bold uppercase text-zinc-400">Test Execution Results</h3>
            <div className="space-y-2">
              {runResults.length === 0 && <p className="text-zinc-500 text-xs">Run your code to execute test cases.</p>}
              {runResults.map((tr, idx) => (
                <div key={idx} className={`p-3 rounded-lg border text-xs flex justify-between items-center ${tr.passed ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/20 border-rose-500/20 text-rose-300'}`}>
                  <div>
                    <p><strong>Input:</strong> {tr.input}</p>
                    <p><strong>Expected:</strong> {tr.expected} | <strong>Got:</strong> {JSON.stringify(tr.got)}</p>
                  </div>
                  <span className="font-bold">{tr.passed ? 'PASSED' : 'FAILED'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor panel */}
        <div className="w-1/2 flex flex-col justify-between">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-zinc-950 text-emerald-400 p-6 font-mono text-sm focus:outline-none resize-none border-b border-zinc-900 text-zinc-100"
            spellCheck={false}
          />
          <div className="h-14 bg-zinc-900/30 px-6 flex items-center justify-between">
            <span className="text-zinc-500 text-xs font-mono">Language: Javascript</span>
            <button
              onClick={runCode}
              disabled={running}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-200 transition"
            >
              {running ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
