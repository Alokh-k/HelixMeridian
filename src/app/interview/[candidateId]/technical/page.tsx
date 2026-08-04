'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function TechnicalRound() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params?.candidateId as string;
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        
        rec.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          handleUserResponse(speechToText);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
      synthRef.current = window.speechSynthesis;
    }
    
    handleUserResponse("Hello, I am ready for the technical round.");
  }, [candidateId]);

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      startListening();
    };
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUserResponse = async (text: string) => {
    if (!candidateId) return;
    setTranscript((prev) => [...prev, { role: 'candidate', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          round: 'technical',
          message: text,
        }),
      });

      const data = await res.json();
      setLoading(false);
      if (data.response) {
        if (data.response.includes('[ROUND_COMPLETED]')) {
          speakText("Excellent. Technical round completed. Transitioning to coding round.");
          setTimeout(() => {
            router.push(`/interview/${candidateId}/coding`);
          }, 3000);
        } else {
          setTranscript((prev) => [...prev, { role: 'interviewer', text: data.response }]);
          speakText(data.response);
        }
      }
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-8 font-sans">
      <header className="border-b border-zinc-900 pb-4 max-w-4xl w-full mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Interview Room</h1>
          <p className="text-xs text-zinc-400">Round 2: Technical Fit</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      </header>

      <main className="max-w-xl w-full mx-auto flex flex-col items-center justify-center space-y-8 flex-1">
        <div className="flex items-center justify-center space-x-2 h-32">
          {[...Array(5)].map((_, idx) => (
            <span
              key={idx}
              className={`w-2 rounded-full bg-emerald-500 transition-all duration-300 ${
                speaking
                  ? 'h-16 animate-pulse'
                  : isListening
                  ? 'h-8 animate-bounce'
                  : 'h-3'
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            ></span>
          ))}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-zinc-200">
            {speaking ? 'Lead Engineer Speaking...' : isListening ? 'Listening...' : loading ? 'Thinking...' : 'Ready'}
          </h2>
          <p className="text-xs text-zinc-500">
            Answer code, framework, or architectural questions spoken by the Lead.
          </p>
        </div>

        <button
          onClick={startListening}
          className="py-3 px-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-semibold border border-zinc-800 text-zinc-300 transition"
        >
          Push to Speak manually
        </button>
      </main>

      <footer className="max-w-4xl w-full mx-auto border-t border-zinc-900 pt-4 max-h-36 overflow-y-auto text-zinc-500 text-xs">
        {transcript.slice(-2).map((t, idx) => (
          <p key={idx}>
            <strong className="text-zinc-400">{t.role.toUpperCase()}:</strong> {t.text}
          </p>
        ))}
      </footer>
    </div>
  );
}
