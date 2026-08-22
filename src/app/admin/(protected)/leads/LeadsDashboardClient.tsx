'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { Lead, LeadStatus, LeadSource } from '@/lib/types';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/types';

type SortField = 'created_at' | 'status' | 'source' | 'email' | 'name' | 'data_quality';
type SortDir = 'asc' | 'desc';

const SOURCE_LABELS: Record<LeadSource, string> = {
  contact: 'CONTACT FORM',
  'risk-scan': 'RISK SCAN',
  demo: 'DEMO REQUEST',
};

const SOURCE_COLORS: Record<LeadSource, string> = {
  contact: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'risk-scan': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  demo: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
};

const QUALITY_COLORS: Record<number, string> = {
  0: 'bg-red-500/20 text-red-400 border-red-500/50',
  1: 'bg-red-500/20 text-red-400 border-red-500/50',
  2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  3: 'bg-green-500/20 text-green-400 border-green-500/50',
  4: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
};

function getQualityLabel(score: number | null): string {
  if (score == null) return 'N/A';
  if (score <= 1) return 'LOW';
  if (score === 2) return 'MED';
  if (score === 3) return 'HIGH';
  return 'PRIME';
}

function getQualityColor(score: number | null): string {
  if (score == null) return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  return QUALITY_COLORS[score] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/50';
}

export default function LeadsDashboardClient({
  initialLeads,
}: {
  initialLeads: Lead[];
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState<LeadSource | 'all'>('all');
  const [filterQuality, setFilterQuality] = useState<'all' | 0 | 1 | 2 | 3 | 4>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...leads];

    if (filterStatus !== 'all') list = list.filter((l) => l.status === filterStatus);
    if (filterSource !== 'all') list = list.filter((l) => l.source === filterSource);
    if (filterQuality !== 'all') {
      list = list.filter((l) => {
        if (filterQuality === 0) return (l.data_quality ?? 0) <= 1;
        if (filterQuality === 4) return (l.data_quality ?? 0) >= 4;
        return l.data_quality === filterQuality;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company_name ?? '').toLowerCase().includes(q) ||
          (l.message ?? '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'source':
          cmp = a.source.localeCompare(b.source);
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'data_quality':
          cmp = (a.data_quality ?? -1) - (b.data_quality ?? -1);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [leads, filterStatus, filterSource, filterQuality, search, sortField, sortDir]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, contacted: 0, qualified: 0, closed: 0 };
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const qualityCounts = useMemo(() => {
    const c = { low: 0, med: 0, high: 0, prime: 0, na: 0 };
    for (const l of leads) {
      const s = l.data_quality;
      if (s == null) c.na++;
      else if (s <= 1) c.low++;
      else if (s === 2) c.med++;
      else if (s === 3) c.high++;
      else c.prime++;
    }
    return c;
  }, [leads]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status } : l))
        );
        if (selected?.id === id) {
          setSelected({ ...selected, status });
        }
      }
    } finally {
      setLoadingId(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs opacity-50">
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  );

  const VerifiedBadge = ({ email, phone }: { email: boolean; phone: boolean }) => (
    <div className="flex gap-1 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] border font-bold tracking-wider ${
          email
            ? 'bg-green-500/10 text-green-400 border-green-500/40'
            : 'bg-red-500/10 text-red-400 border-red-500/40'
        }`}
        title={email ? 'Email verified / deliverable' : 'Email unverified or bounced'}
      >
        {email ? '✓ EMAIL' : '✗ EMAIL'}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] border font-bold tracking-wider ${
          phone
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/40'
            : 'bg-red-500/10 text-red-400 border-red-500/40'
        }`}
        title={phone ? 'Phone: valid SA format' : 'Phone: missing or invalid format'}
      >
        {phone ? '✓ PHONE' : '✗ PHONE'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-yellow-400 text-xs tracking-widest mb-2">{'// CRM_MODULE'}</div>
          <h2 className="text-2xl font-bold text-green-400 tracking-wider">LEADS PIPELINE</h2>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} of {leads.length} records displayed</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              className={`px-4 py-3 border text-left transition-colors ${
                filterStatus === s
                  ? STATUS_COLORS[s] + ' border-opacity-100'
                  : 'border-green-900/50 text-green-600 hover:border-green-500/50'
              }`}
            >
              <div className="text-xs font-bold tracking-wider">{STATUS_LABELS[s]}</div>
              <div className="text-2xl font-bold mt-1">{counts[s]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'low' as const, label: 'LOW QUALITY', count: qualityCounts.low, color: 'border-red-500/50 text-red-400 bg-red-900/10' },
          { key: 'med' as const, label: 'MEDIUM', count: qualityCounts.med, color: 'border-yellow-500/50 text-yellow-400 bg-yellow-900/10' },
          { key: 'high' as const, label: 'HIGH', count: qualityCounts.high, color: 'border-green-500/50 text-green-400 bg-green-900/10' },
          { key: 'prime' as const, label: 'PRIME (4/4)', count: qualityCounts.prime, color: 'border-emerald-500/50 text-emerald-400 bg-emerald-900/10' },
        ].map((q) => (
          <div
            key={q.key}
            className={`px-4 py-3 border ${q.color} transition-colors`}
          >
            <div className="text-xs font-bold tracking-wider">{q.label}</div>
            <div className="text-2xl font-bold mt-1">{q.count}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, company, message..."
          className="flex-1 min-w-64 bg-black border border-green-900/50 text-green-400 px-4 py-2 text-sm focus:outline-none focus:border-green-500 font-mono"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
          className="bg-black border border-green-900/50 text-green-400 px-4 py-2 text-sm focus:outline-none focus:border-green-500 font-mono"
        >
          <option value="all">ALL STATUSES</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as LeadSource | 'all')}
          className="bg-black border border-green-900/50 text-green-400 px-4 py-2 text-sm focus:outline-none focus:border-green-500 font-mono"
        >
          <option value="all">ALL SOURCES</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={String(filterQuality)}
          onChange={(e) => {
            const v = e.target.value;
            setFilterQuality(v === 'all' ? 'all' : (Number(v) as 0 | 1 | 2 | 3 | 4));
          }}
          className="bg-black border border-green-900/50 text-green-400 px-4 py-2 text-sm focus:outline-none focus:border-green-500 font-mono"
        >
          <option value="all">ALL QUALITY</option>
          <option value="0">≤1 — LOW / JUNK</option>
          <option value="2">2 — MEDIUM</option>
          <option value="3">3 — HIGH</option>
          <option value="4">4 — PRIME</option>
        </select>
      </div>

      <div className="border border-green-900/50 bg-black/60 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-900/50 bg-green-950/30">
                {[
                  { field: 'created_at' as SortField, label: 'DATE' },
                  { field: 'name' as SortField, label: 'NAME' },
                  { field: 'email' as SortField, label: 'EMAIL' },
                  { field: 'source' as SortField, label: 'SOURCE' },
                  { field: 'data_quality' as SortField, label: 'VERIFIED' },
                  { field: 'status' as SortField, label: 'STATUS' },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => toggleSort(col.field)}
                    className="px-4 py-3 text-left text-green-600 font-bold tracking-wider text-xs cursor-pointer hover:text-green-400 select-none"
                  >
                    {col.label}
                    <SortIcon field={col.field} />
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-green-600 font-bold tracking-wider text-xs">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-600 font-mono">
                    {'// NO_LEADS_FOUND'}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-green-900/20 hover:bg-green-950/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {format(new Date(lead.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-bold">{lead.name}</td>
                    <td className="px-4 py-3 text-green-300">
                      <div>{lead.email}</div>
                      {lead.company_name && (
                        <div className="text-xs text-gray-500 mt-0.5">{lead.company_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs border font-bold tracking-wider ${SOURCE_COLORS[lead.source]}`}>
                        {SOURCE_LABELS[lead.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <VerifiedBadge email={!!lead.email_verified} phone={!!lead.phone_verified} />
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] border font-bold tracking-wider ${getQualityColor(
                            lead.data_quality
                          )}`}
                        >
                          SCORE: {lead.data_quality ?? '?'} / 4 · {getQualityLabel(lead.data_quality)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        disabled={loadingId === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`px-2 py-1 text-xs border font-bold tracking-wider cursor-pointer bg-transparent ${STATUS_COLORS[lead.status]} disabled:opacity-50`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-black text-green-400">
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(lead)}
                        className="px-3 py-1 text-xs border border-green-800/50 text-green-500 hover:border-green-500 hover:text-green-400 transition-colors"
                      >
                        {'> VIEW'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl border border-green-800/50 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-900/50 bg-green-950/30">
              <div>
                <div className="text-yellow-400 text-xs tracking-widest mb-1">{'// LEAD_DETAILS'}</div>
                <h3 className="text-lg font-bold text-green-400">{selected.name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-green-400 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-green-900/30">
                <VerifiedBadge email={!!selected.email_verified} phone={!!selected.phone_verified} />
                <span
                  className={`inline-block px-2 py-0.5 text-xs border font-bold tracking-wider ${getQualityColor(
                    selected.data_quality
                  )}`}
                >
                  DATA QUALITY: {selected.data_quality ?? '?'} / 4 ({getQualityLabel(selected.data_quality)})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Email</div>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-green-400 hover:underline break-all"
                  >
                    {selected.email}
                  </a>
                </div>
                <div>
                  <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Created</div>
                  <div className="text-gray-400">
                    {format(new Date(selected.created_at), 'PPpp')}
                  </div>
                </div>
                <div>
                  <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Source</div>
                  <span className={`px-2 py-1 text-xs border font-bold tracking-wider ${SOURCE_COLORS[selected.source]}`}>
                    {SOURCE_LABELS[selected.source]}
                  </span>
                </div>
                <div>
                  <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Status</div>
                  <select
                    value={selected.status}
                    disabled={loadingId === selected.id}
                    onChange={(e) => updateStatus(selected.id, e.target.value as LeadStatus)}
                    className={`px-2 py-1 text-xs border font-bold tracking-wider cursor-pointer bg-transparent ${STATUS_COLORS[selected.status]} disabled:opacity-50`}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-black text-green-400">
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                {(selected.phone || selected.website || selected.company_name) && (
                  <>
                    <div>
                      <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Phone</div>
                      <div className="text-gray-400 flex items-center gap-2">
                        {selected.phone || <span className="text-gray-600">—</span>}
                        {selected.phone && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 border font-bold ${
                              selected.phone_verified
                                ? 'text-blue-400 border-blue-500/40 bg-blue-500/10'
                                : 'text-red-400 border-red-500/40 bg-red-500/10'
                            }`}
                          >
                            {selected.phone_verified ? '✓ SA VALID' : '✗ INVALID'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Website</div>
                      {selected.website ? (
                        <a
                          href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:underline"
                        >
                          {selected.website}
                        </a>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </div>
                    <div>
                      <div className="text-green-700 text-xs uppercase tracking-wider mb-1">Company</div>
                      <div className="text-gray-400">{selected.company_name || <span className="text-gray-600">—</span>}</div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="text-green-700 text-xs uppercase tracking-wider mb-2">Message</div>
                <div className="border border-green-900/50 bg-green-950/10 p-4 text-gray-300 font-mono text-sm whitespace-pre-wrap min-h-32">
                  {selected.message || '// no message provided'}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href={`mailto:${selected.email}`}
                  className="flex-1 py-3 border border-green-500 text-green-400 font-mono text-sm tracking-wider hover:bg-green-600/20 transition-colors text-center"
                >
                  {'> REPLY VIA EMAIL'}
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-3 border border-gray-700 text-gray-400 font-mono text-sm tracking-wider hover:bg-gray-900/50 transition-colors"
                >
                  {'> CLOSE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
