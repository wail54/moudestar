'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Gift, CheckCircle, XCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface StoreCredit {
  id: string;
  code: string;
  amount: number;
  remaining: number;
  isActive: boolean;
  issuedAt: string;
  usedAt: string | null;
  expiresAt: string | null;
  reason: string;
  sourceOrderId: string | null;
  profile: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function CreditsAdminPage() {
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  const loadCredits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store-credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCredits(); }, []);

  const filtered = credits.filter((c) => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? c.isActive && c.remaining > 0 :
      !c.isActive || c.remaining === 0;
    const q = query.toLowerCase();
    const matchQuery = !q ||
      c.code.toLowerCase().includes(q) ||
      c.profile?.email?.toLowerCase().includes(q) ||
      c.sourceOrderId?.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  const totalIssued = credits.reduce((s, c) => s + c.amount, 0);
  const totalRemaining = credits.reduce((s, c) => s + c.remaining, 0);
  const activeCount = credits.filter((c) => c.isActive && c.remaining > 0).length;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {/* Header */}
      <div className="border-b border-[var(--border-soft)] bg-white px-6 md:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] hover:text-black transition-colors">
            <ArrowLeft size={14} />
            Admin
          </Link>
          <span className="text-[var(--border-soft)]">/</span>
          <h1 className="font-cormorant text-2xl font-light tracking-tight">Avoirs</h1>
        </div>
        <button onClick={loadCredits} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] hover:text-black transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total émis', value: `${totalIssued.toFixed(2)} €`, sub: `${credits.length} avoirs` },
            { label: 'Restant actif', value: `${totalRemaining.toFixed(2)} €`, sub: `${activeCount} avoirs actifs` },
            { label: 'Utilisés', value: `${(totalIssued - totalRemaining).toFixed(2)} €`, sub: `${credits.length - activeCount} avoirs épuisés` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-[var(--border-soft)] rounded-sm p-5">
              <p className="text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] mb-2">{stat.label}</p>
              <p className="text-2xl font-medium">{stat.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'active', 'used'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-[10px] font-medium uppercase tracking-widest rounded-sm border transition-colors ${
                filter === f ? 'bg-black text-white border-black' : 'bg-white border-[var(--border-soft)] hover:border-black'
              }`}>
                {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Utilisés'}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Code, email, commande..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[var(--border-soft)] rounded-sm outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-sm border border-[var(--border-soft)] divide-y divide-[var(--border-soft)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-[var(--bg-alt)] m-1 rounded-xs" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-sm border border-[var(--border-soft)]">
            <Gift size={32} className="mx-auto mb-4 text-[var(--text-muted)]" strokeWidth={1} />
            <p className="font-cormorant text-2xl font-light">Aucun avoir trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-sm border border-[var(--border-soft)] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-[var(--bg-alt)] border-b border-[var(--border-soft)]">
              {['Code', 'Client', 'Montant initial', 'Restant', 'Statut', 'Origine'].map((h) => (
                <span key={h} className="text-[9px] font-medium uppercase tracking-widest text-[var(--text-muted)]">{h}</span>
              ))}
            </div>
            {/* Rows */}
            {filtered.map((credit, i) => {
              const isUsed = !credit.isActive || credit.remaining === 0;
              return (
                <motion.div
                  key={credit.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-[var(--border-soft)] last:border-0 items-center hover:bg-[var(--bg-alt)] transition-colors"
                >
                  {/* Code */}
                  <span className="font-mono text-xs font-medium">{credit.code}</span>

                  {/* Client */}
                  <div>
                    {credit.profile ? (
                      <>
                        {(credit.profile.firstName || credit.profile.lastName) && (
                          <p className="text-xs font-medium">{[credit.profile.firstName, credit.profile.lastName].filter(Boolean).join(' ')}</p>
                        )}
                        <p className="text-[10px] text-[var(--text-muted)]">{credit.profile.email}</p>
                      </>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] italic">Anonyme (caisse)</span>
                    )}
                  </div>

                  {/* Montant initial */}
                  <span className="text-sm font-medium">{credit.amount.toFixed(2)} €</span>

                  {/* Restant */}
                  <span className={`text-sm font-medium ${credit.remaining > 0 ? 'text-green-600' : 'text-[var(--text-muted)] line-through'}`}>
                    {credit.remaining.toFixed(2)} €
                  </span>

                  {/* Statut */}
                  <div className="flex items-center gap-1.5">
                    {isUsed ? (
                      <><XCircle size={13} className="text-[var(--text-muted)]" /><span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Utilisé</span></>
                    ) : (
                      <><CheckCircle size={13} className="text-green-600" /><span className="text-[10px] uppercase tracking-widest text-green-700">Actif</span></>
                    )}
                  </div>

                  {/* Origine */}
                  <div>
                    {credit.sourceOrderId ? (
                      <Link
                        href={`/admin#order-${credit.sourceOrderId}`}
                        className="text-[10px] text-blue-600 hover:underline font-mono"
                      >
                        #{credit.sourceOrderId.slice(-8)}
                      </Link>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] capitalize">{credit.reason || '—'}</span>
                    )}
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                      {new Date(credit.issuedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
