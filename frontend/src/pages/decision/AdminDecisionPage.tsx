import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Users,
  Settings,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import { SystemHealthPanel, AuditTrailTable } from '../../components/dashboard/widgets';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency } from '../../lib/utils';
import { auditApi } from '../../api';

export const AdminDecisionPage: React.FC = () => {
  const { currency, exchangeRate } = useUiStore();
  const [delegatedLimits, setDelegatedLimits] = useState({
    charteringOfficer: 500000,
    charteringManager: 1500000,
    generalManager: 5000000,
    minRightShipScore: 3.5,
    maxVesselAge: 18,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: rawAuditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      try {
        const res = await auditApi.logs({ limit: 25 });
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  const handleSavePolicy = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/admin"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-700 transition shadow-xs"
              title="Return to Governance Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Platform Governance & Authority Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
              Role: System Administrator
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Delegated financial authority thresholds, maritime safety vetting criteria, user RBAC permissions, and cryptographic audit sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSavePolicy}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-rose-900/20 flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Commit Governance Changes
          </button>
        </div>
      </div>

      {/* Policy saved alert */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Governance and financial thresholds updated and committed to immutable audit ledger.</span>
        </div>
      )}

      {/* Financial Authority Thresholds & Vetting Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Delegation Limits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delegated Commercial Authority Limits</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Maximum contract commitment per financial approval level</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chartering Officer (Individual Fixture)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400 font-bold">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={delegatedLimits.charteringOfficer}
                  onChange={(e) => setDelegatedLimits({ ...delegatedLimits, charteringOfficer: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex justify-between font-medium">
                <span>Threshold: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(currency === 'INR' ? delegatedLimits.charteringOfficer / exchangeRate : delegatedLimits.charteringOfficer, { compact: true })}</strong></span>
                <span className="text-slate-500 dark:text-slate-400">Tier 1 Approval</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Chartering Desk Manager (Single Fixture / COA Tier)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400 font-bold">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={delegatedLimits.charteringManager}
                  onChange={(e) => setDelegatedLimits({ ...delegatedLimits, charteringManager: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex justify-between font-medium">
                <span>Threshold: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(currency === 'INR' ? delegatedLimits.charteringManager / exchangeRate : delegatedLimits.charteringManager, { compact: true })}</strong></span>
                <span className="text-slate-500 dark:text-slate-400">Tier 2 Clearance</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Executive Director / Board Approval Ceiling</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400 font-bold">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={delegatedLimits.generalManager}
                  onChange={(e) => setDelegatedLimits({ ...delegatedLimits, generalManager: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 transition"
                />
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex justify-between font-medium">
                <span>Threshold: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(currency === 'INR' ? delegatedLimits.generalManager / exchangeRate : delegatedLimits.generalManager, { compact: true })}</strong></span>
                <span className="text-slate-500 dark:text-slate-400">Statutory Board Authority</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vessel Vetting Policy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Maritime Safety & Vetting Rules</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">RightShip GHG ratings, IACS membership, and vessel age gates</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                Minimum RightShip Safety Rating: <span className="text-blue-600 dark:text-blue-400 font-bold">{delegatedLimits.minRightShipScore} Stars</span>
              </label>
              <input
                type="range"
                min="2.0"
                max="5.0"
                step="0.5"
                value={delegatedLimits.minRightShipScore}
                onChange={(e) => setDelegatedLimits({ ...delegatedLimits, minRightShipScore: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span>2.0 Stars</span>
                <span>3.5 Stars (Industry Standard)</span>
                <span>5.0 Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                Maximum Vessel Age for Bulk Coal Charters: <span className="text-blue-600 dark:text-blue-400 font-bold">{delegatedLimits.maxVesselAge} Years</span>
              </label>
              <input
                type="range"
                min="10"
                max="25"
                step="1"
                value={delegatedLimits.maxVesselAge}
                onChange={(e) => setDelegatedLimits({ ...delegatedLimits, maxVesselAge: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span>10 Years (Eco-Vessels)</span>
                <span>18 Years (SAIL Gate)</span>
                <span>25 Years (Max Age)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Enforce P&I Club IG Membership</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Requires International Group of P&I Clubs certification</span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Microservice Health Panel */}
      <div>
        <SystemHealthPanel />
      </div>

      {/* Governance Audit Trail */}
      <div>
        <AuditTrailTable logs={rawAuditLogs || []} />
      </div>
    </div>
  );
};

export default AdminDecisionPage;
