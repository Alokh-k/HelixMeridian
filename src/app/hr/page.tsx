'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CandidateDrawer from './candidate-drawer';

type Candidate = {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  status: string;
  techStack: string | null;
  evaluationScore: number | null;
};

export default function HrDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/hr/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/hr/candidates');
      const data = await res.json();
      if (data.candidates) setCandidates(data.candidates);
    } catch (e) {
      console.error('Failed to fetch candidates', e);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const awaitingInvite = useMemo(
    () => candidates.filter((c) => c.status === 'IMPORTED'),
    [candidates]
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllAwaiting = () => {
    const ids = awaitingInvite.map((c) => c.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/hr/import', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Import failed');
        return;
      }

      setImportMessage(`Imported ${data.importedCount} candidate(s).`);
      if (data.errors?.length) {
        setImportMessage((prev) => `${prev} ${data.errors.length} row(s) skipped.`);
      }

      await fetchCandidates();
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const sendInvites = async (ids: string[]) => {
    if (ids.length === 0) return;

    setSending(true);
    try {
      const res = await fetch('/api/hr/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to send invites');
        return;
      }

      if (data.failed?.length) {
        alert(`Sent ${data.sentCount} invite(s). ${data.failed.length} failed.`);
      }

      setSelectedIds([]);
      await fetchCandidates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/hr/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.candidate) {
        setSelectedCandidate(null);
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-6 border-b border-zinc-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                HelixMeridian HR Portal
              </h1>
              <p className="text-zinc-400 text-sm mt-1">Upload candidates and send interview invites</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl transition font-medium self-center"
            >
              Logout
            </button>
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3 min-w-[320px]">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Import candidates</p>
              <p className="text-xs text-zinc-500 mt-1">Excel columns: Name, Phone Number, Email</p>
            </div>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                disabled={importing}
                className="block w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold hover:file:bg-indigo-500"
              />
            </label>
            {importing && <p className="text-xs text-indigo-400">Importing...</p>}
            {importMessage && <p className="text-xs text-emerald-400">{importMessage}</p>}
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: 'Total Candidates', val: candidates.length },
            { label: 'Awaiting Invite', val: awaitingInvite.length },
            { label: 'Invited', val: candidates.filter((c) => c.status === 'INVITED').length },
            { label: 'Completed Reviews', val: candidates.filter((c) => c.evaluationScore !== null && c.evaluationScore !== undefined).length },
          ].map((stat, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase">{stat.label}</span>
              <span className="text-3xl font-bold text-zinc-100 mt-2">{stat.val}</span>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            Select imported candidates and send interview invitation emails.
          </p>
          <button
            onClick={() => sendInvites(selectedIds)}
            disabled={sending || selectedIds.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : `Send invite${selectedIds.length === 1 ? '' : 's'} (${selectedIds.length})`}
          </button>
        </div>

        <main className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs uppercase font-semibold">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={awaitingInvite.length > 0 && awaitingInvite.every((c) => selectedIds.includes(c.id))}
                    onChange={toggleSelectAllAwaiting}
                    disabled={awaitingInvite.length === 0}
                  />
                </th>
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No candidates yet. Upload an Excel file to get started.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-zinc-800/30 transition text-sm">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(candidate.id)}
                        onChange={() => toggleSelected(candidate.id)}
                        disabled={candidate.status !== 'IMPORTED'}
                      />
                    </td>
                    <td className="p-4 font-semibold text-zinc-200">{candidate.fullName || '—'}</td>
                    <td className="p-4 text-zinc-300">{candidate.phoneNumber || '—'}</td>
                    <td className="p-4 text-zinc-300">{candidate.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-zinc-800 text-zinc-300">
                        {candidate.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-indigo-400">{candidate.evaluationScore ?? '—'}</td>
                    <td className="p-4 text-right space-x-2">
                      {candidate.status === 'IMPORTED' && (
                        <button
                          onClick={() => sendInvites([candidate.id])}
                          disabled={sending}
                          className="text-xs bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-white font-semibold"
                        >
                          Send mail
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 font-semibold"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </main>
      </div>

      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onStatusChange={(status) => handleStatusUpdate(selectedCandidate.id, status)}
        />
      )}
    </div>
  );
}
