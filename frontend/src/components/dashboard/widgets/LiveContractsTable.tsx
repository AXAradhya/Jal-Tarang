import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUiStore } from '../../../store/uiStore';
import { formatCurrency, formatRateMt } from '../../../lib/utils';

export interface LiveContractsTableProps {
  contracts: any[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const LiveContractsTable: React.FC<LiveContractsTableProps> = ({
  contracts = [],
  isLoading = false,
  title = 'Live Contract & Fixture Registry',
  subtitle = 'Comprehensive real-time fixture registry with counterparty terms and vessel allocations',
  className,
}) => {
  const { currency } = useUiStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'COA' | 'SPOT'>('ALL');
  const [showAll, setShowAll] = useState(false);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c: any) => {
      const matchSearch =
        !search.trim() ||
        (c.contract_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.counterparty_name || c.counterparty || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.vessel_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.cargo_type_name || c.cargo_type || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filter === 'ALL') return true;
      if (filter === 'ACTIVE') return c.status === 'ACTIVE';
      if (filter === 'CONFIRMED') return c.status === 'CONFIRMED' || c.status === 'APPROVED';
      if (filter === 'COA') return (c.charter_type || c.contract_type || '').includes('COA') || (c.contract_type || '').includes('AFFREIGHTMENT');
      if (filter === 'SPOT') return (c.charter_type || c.contract_type || '').includes('SPOT') || (c.contract_type || '').includes('VOYAGE');
      return true;
    });
  }, [contracts, search, filter]);

  const displayed = showAll ? filteredContracts : filteredContracts.slice(0, 8);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">ACTIVE</span>;
    }
    if (s === 'CONFIRMED' || s === 'APPROVED') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">CONFIRMED</span>;
    }
    if (s === 'IN_NEGOTIATION' || s === 'SUBMITTED') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">NEGOTIATING</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{s || 'DRAFT'}</span>;
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden ${className || ''}`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
              {filteredContracts.length} of {contracts.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contract, counterparty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 w-52 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            {(['ALL', 'ACTIVE', 'CONFIRMED', 'COA', 'SPOT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2 py-1 rounded-md transition-colors text-[11px] font-semibold ${
                  filter === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Contract Ref</th>
              <th className="px-4 py-3">Counterparty / Owner</th>
              <th className="px-4 py-3">Vessel Allocation</th>
              <th className="px-4 py-3">Charter Type</th>
              <th className="px-4 py-3">Rate / MT</th>
              <th className="px-4 py-3">Committed Cargo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayed.length > 0 ? (
              displayed.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {c.contract_code || c.id?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {c.counterparty_name || c.counterparty || 'Commercial Partner'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {c.vessel_name || 'TBN / Nominated'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.charter_type || c.contract_type || 'VOYAGE'}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white tabular-nums">
                    {Number(c.freight_rate_usd_mt || c.rate_usd || 0) > 0 ? formatRateMt(Number(c.freight_rate_usd_mt || c.rate_usd)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                    {Number(c.committed_volume_mt || c.quantity_mt || 75000).toLocaleString()} MT
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/contracts?id=${c.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <span>View</span>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No contracts match the current search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredContracts.length > 8 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAll ? 'Show Fewer Contracts' : `Show All ${filteredContracts.length} Contracts`}
          </button>
        </div>
      )}
    </div>
  );
};
