'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { StackVendor, StackNfrStatus, StackTier } from '@/lib/types';
import {
  STACK_STATUSES,
  STACK_TIERS,
  STACK_STATUS_LABELS,
  STACK_STATUS_COLORS,
} from '@/lib/types';

const TIER_COLORS: Record<StackTier, string> = {
  'Track 1': 'border-yellow-600/50 text-yellow-400 bg-yellow-900/10',
  'Track 2': 'border-blue-600/50 text-blue-400 bg-blue-900/10',
  'Track 3': 'border-gray-600/50 text-gray-400 bg-gray-900/10',
};

const TIER_BORDER: Record<StackTier, string> = {
  'Track 1': 'hover:border-yellow-500/50',
  'Track 2': 'hover:border-blue-500/50',
  'Track 3': 'hover:border-gray-500/50',
};

const STATUS_ICONS: Record<StackNfrStatus, string> = {
  not_started: '○',
  nfr_requested: '◐',
  active: '●',
  partner: '★',
};

export default function StackDashboardClient({
  initialVendors,
}: {
  initialVendors: StackVendor[];
}) {
  const [vendors, setVendors] = useState<StackVendor[]>(initialVendors);
  const [filterTier, setFilterTier] = useState<StackTier | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StackNfrStatus | 'all'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const list = vendors.filter((v) => {
      if (filterTier !== 'all' && v.tier !== filterTier) return false;
      if (filterStatus !== 'all' && v.nfr_partner_status !== filterStatus) return false;
      return true;
    });

    const groups: Record<StackTier, StackVendor[]> = {
      'Track 1': [],
      'Track 2': [],
      'Track 3': [],
    };
    for (const v of list) groups[v.tier].push(v);
    return groups;
  }, [vendors, filterTier, filterStatus]);

  const counts = useMemo(() => {
    const byTier: Record<StackTier, number> = { 'Track 1': 0, 'Track 2': 0, 'Track 3': 0 };
    const byStatus: Record<StackNfrStatus, number> = {
      not_started: 0, nfr_requested: 0, active: 0, partner: 0,
    };
    for (const v of vendors) {
      byTier[v.tier]++;
      byStatus[v.nfr_partner_status]++;
    }
    return { byTier, byStatus, total: vendors.length };
  }, [vendors]);

  const updateStatus = async (id: string, status: StackNfrStatus) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/stack', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setVendors((prev) =>
          prev.map((v) =>
            v.id === id
              ? {
                  ...v,
                  nfr_partner_status: status,
                  connected_at:
                    status === 'active' || status === 'partner'
                      ? new Date().toISOString()
                      : v.connected_at,
                  updated_at: new Date().toISOString(),
                }
              : v
          )
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-yellow-400 text-xs tracking-widest mb-2">{'// STACK_OPS'}</div>
          <h2 className="text-2xl font-bold text-green-400 tracking-wider">VENDOR STACK STATUS</h2>
          <p className="text-gray-500 text-sm mt-1">
            {counts.total} vendors · Active: {counts.byStatus.active + counts.byStatus.partner}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {STACK_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              className={`px-4 py-3 border text-left transition-colors ${
                filterStatus === s
                  ? STACK_STATUS_COLORS[s] + ' border-opacity-100'
                  : 'border-green-900/50 text-green-600 hover:border-green-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{STATUS_ICONS[s]}</span>
                <div>
                  <div className="text-xs font-bold tracking-wider">{STACK_STATUS_LABELS[s]}</div>
                  <div className="text-2xl font-bold mt-1">{counts.byStatus[s]}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value as StackTier | 'all')}
          className="bg-black border border-green-900/50 text-green-400 px-4 py-2 text-sm focus:outline-none focus:border-green-500 font-mono"
        >
          <option value="all">ALL TIERS</option>
          {STACK_TIERS.map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StackNfrStatus | 'all')}
          className="bg-black border border-green-900/50 text-green-400 px-4 py-2 text-sm focus:outline-none focus:border-green-500 font-mono"
        >
          <option value="all">ALL STATUSES</option>
          {STACK_STATUSES.map((s) => (
            <option key={s} value={s}>{STACK_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-3 text-xs text-gray-600">
          {STACK_TIERS.map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 border ${TIER_COLORS[t].split(' ')[0]}`} />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {(Object.keys(grouped) as StackTier[]).map((tier) => {
        const items = grouped[tier];
        if (items.length === 0) return null;
        const activeCount = items.filter(
          (v) => v.nfr_partner_status === 'active' || v.nfr_partner_status === 'partner'
        ).length;

        return (
          <section key={tier} className="space-y-4">
            <div className="flex items-baseline gap-4 border-b border-green-900/30 pb-3">
              <h3 className="text-xl font-bold tracking-wider text-green-400 flex items-center gap-3">
                <span className={`inline-block px-3 py-1 text-xs border ${TIER_COLORS[tier]}`}>
                  {tier.toUpperCase()}
                </span>
              </h3>
              <span className="text-gray-500 text-sm font-mono">
                {items.length} vendors · {activeCount} online
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((v) => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  loading={loadingId === v.id}
                  onStatusChange={(s) => updateStatus(v.id, s)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {Object.values(grouped).every((arr) => arr.length === 0) && (
        <div className="text-center py-16 text-gray-600 font-mono border border-green-900/30">
          {'// NO_VENDORS_MATCH_FILTER'}
        </div>
      )}
    </div>
  );
}

function VendorCard({
  vendor,
  loading,
  onStatusChange,
}: {
  vendor: StackVendor;
  loading: boolean;
  onStatusChange: (s: StackNfrStatus) => void;
}) {
  return (
    <div
      className={`border border-green-900/50 bg-black/60 backdrop-blur p-5 transition-all ${TIER_BORDER[vendor.tier]} hover:bg-green-950/10`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-block px-2 py-0.5 text-xs border font-bold tracking-wider ${TIER_COLORS[vendor.tier]}`}>
              {vendor.tier.toUpperCase()}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border font-bold tracking-wider ${STACK_STATUS_COLORS[vendor.nfr_partner_status]}`}
            >
              <span>{STATUS_ICONS[vendor.nfr_partner_status]}</span>
              {STACK_STATUS_LABELS[vendor.nfr_partner_status]}
            </span>
          </div>
          <h4 className="text-lg font-bold text-green-300 truncate">{vendor.vendor_name}</h4>
        </div>
      </div>

      {vendor.notes && (
        <div className="mb-4 text-xs text-gray-500 border-l-2 border-green-900/50 pl-3 py-1 leading-relaxed">
          {vendor.notes}
        </div>
      )}

      {(vendor.connected_at || vendor.updated_at) && (
        <div className="mb-4 text-xs text-gray-600 space-y-1">
          {vendor.connected_at && (
            <div className="flex justify-between">
              <span>Connected:</span>
              <span className="text-green-600">
                {format(new Date(vendor.connected_at), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Last updated:</span>
            <span className="text-gray-500">
              {format(new Date(vendor.updated_at), 'MMM d, HH:mm')}
            </span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-green-700 text-xs uppercase tracking-wider mb-2">
          {'// UPDATE STATUS'}
        </label>
        <div className="grid grid-cols-2 gap-1">
          {STACK_STATUSES.map((s) => {
            const active = vendor.nfr_partner_status === s;
            return (
              <button
                key={s}
                disabled={loading}
                onClick={() => onStatusChange(s)}
                className={`px-2 py-2 text-xs font-bold tracking-wider border transition-colors disabled:opacity-50 ${
                  active
                    ? STACK_STATUS_COLORS[s] + ' border-opacity-100'
                    : 'border-green-900/30 text-green-700 hover:border-green-500/50 hover:text-green-500'
                }`}
              >
                <span className="mr-1">{STATUS_ICONS[s]}</span>
                {STACK_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {vendor.vendor_url && (
        <a
          href={vendor.vendor_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2 border border-green-900/50 text-green-600 text-xs tracking-wider hover:border-green-500/50 hover:text-green-400 hover:bg-green-900/10 transition-colors font-mono"
        >
          {'> VISIT VENDOR ↗'}
        </a>
      )}
    </div>
  );
}
