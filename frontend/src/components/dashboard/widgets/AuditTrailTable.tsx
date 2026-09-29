import React from 'react';
import { ShieldCheck, User, Clock } from 'lucide-react';

export interface AuditTrailItem {
  id?: string;
  user_email?: string;
  userEmail?: string;
  action?: string;
  entity_type?: string;
  entityType?: string;
  created_at?: string;
  createdAt?: string;
  ip_address?: string;
  [key: string]: any;
}

export interface AuditTrailTableProps {
  logs?: AuditTrailItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  logs = [],
  title = 'Real-Time Audit Trail & Security Ledger',
  subtitle = 'Immutable operational audit events and commercial approvals',
  className,
}) => {
  const items = logs || [];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden ${className || ''}`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
          {items.length} Events
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Authorized User</th>
              <th className="px-4 py-3">Action Executed</th>
              <th className="px-4 py-3">Entity Domain</th>
              <th className="px-4 py-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldCheck size={28} className="mb-2 opacity-40 text-blue-500" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No audit trail records found</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Security actions and authorization logs will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((log, i) => {
              const email = log.user_email || log.userEmail || 'system@sail.in';
              const action = log.action || 'OPERATION';
              const entity = log.entity_type || log.entityType || 'SYSTEM';
              const dt = log.created_at || log.createdAt;

              return (
                <tr key={log.id || i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" />
                    <span>{email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {entity}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]">
                    {dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
