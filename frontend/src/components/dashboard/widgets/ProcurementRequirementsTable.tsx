import React from 'react';
import { Package, Calendar, MapPin, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ProcurementRequirementsTableProps {
  requirements?: any[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const ProcurementRequirementsTable: React.FC<ProcurementRequirementsTableProps> = ({
  requirements = [],
  title = 'Live Procurement Requirements & Orders',
  subtitle = 'Plant raw material requisition feed with parcel sizes and gateway allocations',
  className,
}) => {
  const items = requirements || [];

  const getUrgencyBadge = (urgency: string) => {
    const u = (urgency || '').toUpperCase();
    if (u === 'CRITICAL') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">CRITICAL</span>;
    }
    if (u === 'HIGH') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">HIGH</span>;
    }
    if (u === 'MEDIUM') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">MEDIUM</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">LOW</span>;
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs ${className || ''}`}>
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <Link
          to="/cargo"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shrink-0 shadow-xs"
        >
          <span>New Cargo Requirement</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-12 px-4 text-center border-t border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Package size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No active procurement requirements found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Live plant raw material requisitions and parcel schedules will populate automatically from the procurement service.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Commodity Grade</th>
                <th className="px-4 py-3">Target Plant</th>
                <th className="px-4 py-3">Volume (MT)</th>
                <th className="px-4 py-3">Discharge Port</th>
                <th className="px-4 py-3">Required Laycan</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((r: any, idx: number) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {r.cargoType || r.commodity_name || 'Prime Coking Coal'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    <span>{r.plant || r.destination_plant || 'Bhilai Steel Plant'}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white tabular-nums">
                    {Number(r.quantityMt || r.quantity_mt || 75000).toLocaleString()} MT
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {r.dischargePort || r.destination_port || 'Paradip Port'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{r.laycan || 'Within 30 Days'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getUrgencyBadge(r.urgency || r.priority || 'MEDIUM')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {r.status || 'ACTIVE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
