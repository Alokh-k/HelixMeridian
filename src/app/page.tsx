import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full text-center space-y-8 bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl">
        <header className="space-y-3">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            HelixMeridian AI HR Screening
          </h1>
          <p className="text-zinc-400 text-sm">
            An autonomous interview platform driven by generative AI to screen and evaluate candidate profiles.
          </p>
        </header>

        <main className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-left">
            {[
              { title: 'Personal Fit', desc: 'A voice round evaluating core soft skills and team alignment.' },
              { title: 'Technical Fit', desc: 'A voice round querying engineering principles and stack experience.' },
              { title: 'Coding Sandbox', desc: 'An interactive coding round with real-time test execution.' },
            ].map((round, idx) => (
              <div key={idx} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{round.title}</h3>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{round.desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="pt-6 border-t border-zinc-850 flex justify-center space-x-4">
          <Link
            href="/hr"
            className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm text-white transition shadow-lg shadow-indigo-600/20"
          >
            Launch HR Portal
          </Link>
        </footer>
      </div>
    </div>
  );
}
