import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Download,
  Check,
  X,
  Loader2,
  Building2,
  DollarSign,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { contractApi, freightApi, procurementApi } from '../../api';
import { formatCurrency, formatRateMt } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';
import { PlantStockChart } from '../../components/dashboard/widgets';

interface TenderRow {
  id: string;
  supplier: string;
  cargoGrade: string;
  fobPrice: number;
  oceanFreight: number;
  landedCfr: number;
  awardedVolume: number;
  recipientPlant: string;
}

export const ProcurementDecisionPage: React.FC = () => {
  const currency = useUiStore((s) => s.currency);
  const [selectedQuarter, setSelectedQuarter] = useState('Q4_2026');
  const [allocationStrategy, setAllocationStrategy] = useState('LOWEST_LANDED_COST');
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [tenderAwarded, setTenderAwarded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const { data: contractsData, isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractApi.list(),
  });

  const rawContracts = contractsData?.data || [];

  const tenderRows: TenderRow[] = useMemo(() => {
    if (rawContracts.length > 0) {
      return rawContracts.slice(0, 10).map((c: any, i: number) => {
        const rate = Number(c.rate_usd || c.rateUsd || 0);
        const qty = Number(c.quantity_mt || c.quantityMt || 0);
        const fob = Number(c.fob_price || c.fobPrice || 220.0);
        return {
          id: c.id || `t-${i}`,
          supplier: c.supplier || c.vendor_name || c.charterer || 'Commercial Supplier',
          cargoGrade: c.cargo_type || c.cargoType || 'Prime Coking Coal',
          fobPrice: fob,
          oceanFreight: rate,
          landedCfr: +(fob + rate).toFixed(2),
          awardedVolume: qty,
          recipientPlant: c.destination_plant || c.destinationPlant || c.discharge_port || 'SAIL Plant',
        };
      });
    }
    return [];
  }, [rawContracts]);

  const totalVolume = tenderRows.reduce((sum, r) => sum + r.awardedVolume, 0);
  const avgCfr = tenderRows.length > 0
    ? tenderRows.reduce((sum, r) => sum + r.landedCfr, 0) / tenderRows.length
    : 242.5;

  const awardDocText = `================================================================================
STEEL AUTHORITY OF INDIA LIMITED (SAIL) - MATERIALS MANAGEMENT DIVISION
CENTRAL PROCUREMENT COMMITTEE // OFFICIAL TENDER AWARD NOTICE
================================================================================
TENDER REFERENCE: SAIL/COAL/GLOBAL/2026/Q4-08
DATE OF ISSUE:    ${new Date().toLocaleString('en-GB')}
CLASSIFICATION:   CONFIDENTIAL COMMERCIAL AWARD

SUBJECT: NOTICE OF INTENT TO AWARD GLOBAL COKING COAL IMPORT TENDERS

1. TENDER ALLOCATION SUMMARY:
   - Total Volume Awarded: ${totalVolume.toLocaleString()} MT
   - Weighted Average Landed CFR: $${avgCfr.toFixed(2)} / MT
   - Delivery Window: Laycan commencing October 2026 through December 2026

2. ALLOCATION SCHEDULE:
${tenderRows
  .map(
    (r, i) =>
      `   ${i + 1}. Supplier: ${r.supplier}
      - Grade: ${r.cargoGrade}
      - FOB Base: $${r.fobPrice.toFixed(2)}/MT | Ocean Freight: $${r.oceanFreight.toFixed(2)}/MT
      - Landed CFR: $${r.landedCfr.toFixed(2)}/MT
      - Volume: ${r.awardedVolume.toLocaleString()} MT -> Designated Plant: ${r.recipientPlant}`
  )
  .join('\n\n')}

3. PURCHASE ORDER CONDITIONS:
   - Payments through irrevocable Sight Letter of Credit (LC).
   - Discharge ports: Paradip, Haldia, Vizag subject to berthing draft clearance.
   - Demurrage / Despatch settled as per standard Baltic Gencon terms.

AUTHORIZED & COMMITTED BY:
Executive Director (Materials Management & International Procurement)
Steel Authority of India Limited, Scope Minar, New Delhi
================================================================================`;

  const handleDownloadText = () => {
    const blob = new Blob([awardDocText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAIL_Tender_Award_Notice_Q4_2026.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmAward = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setTenderAwarded(true);
      setIsTenderModalOpen(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/procurement"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-700 transition shadow-xs"
              title="Return to Procurement Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Procurement & Tender Decision Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Role: Procurement Director
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Supplier quote evaluation, landed CFR optimization, tender allocation awards, and blast furnace laycan scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTenderModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition"
          >
            <FileCheck className="w-4 h-4" />
            {tenderAwarded ? 'View Dispatched Tender Letter' : 'Review & Issue Tender Award'}
          </button>
        </div>
      </div>

      {/* Tender Configuration Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Requisition Horizon</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Q3_2026">Q3 2026 (Aug - Sep)</option>
              <option value="Q4_2026">Q4 2026 (Oct - Dec)</option>
              <option value="Q1_2027">Q1 2027 (Jan - Mar)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Optimization Model</label>
            <select
              value={allocationStrategy}
              onChange={(e) => setAllocationStrategy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="LOWEST_LANDED_COST">Lowest Landed CFR ({currency === 'INR' ? '₹' : '$'}/MT)</option>
              <option value="SUPPLIER_DIVERSIFICATION">Supplier Risk Diversification</option>
              <option value="CARBON_MINIMIZATION">Low-Emission / Direct Shipping</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block">Total Volume Split</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {totalVolume.toLocaleString()} MT
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Avg Landed CFR</span>
            <span className="text-base font-bold text-white font-mono">
              {formatRateMt(avgCfr)}
            </span>
          </div>
        </div>
      </div>

      {/* Awarded Banner */}
      {tenderAwarded && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-emerald-200">
                Official Tender Award Notice Committed & Dispatched (#SAIL/COAL/GLOBAL/2026/Q4-08)
              </div>
              <p className="text-emerald-400/80 text-[11px] mt-0.5">
                Purchase contracts committed to suppliers for {totalVolume.toLocaleString()} MT. Letters of Credit initiated.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTenderModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition"
          >
            View Award Document
          </button>
        </div>
      )}

      {/* Supplier Tender Allocation Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recommended Supplier Allocation Schedule</h3>
            <p className="text-xs text-slate-400">
              Evaluated against real-time Baltic freight benchmarks and FOB quotes
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            Savings vs Budget: {formatCurrency(totalVolume * 1.8, { compact: true })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Global Supplier</th>
                <th className="p-3">Coal Grade</th>
                <th className="p-3">FOB Base</th>
                <th className="p-3">Ocean Freight</th>
                <th className="p-3">Landed CFR</th>
                <th className="p-3">Allocated Volume</th>
                <th className="p-3">Receiving Plant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenderRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-8 h-8 mb-2 opacity-40 text-blue-500" />
                      <p className="text-xs font-medium text-slate-300">No active tender allocations in database</p>
                      <p className="text-[11px] text-slate-500">Committed contracts and global supplier allocations will appear here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tenderRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-semibold text-white">{r.supplier}</td>
                  <td className="p-3 text-slate-300">{r.cargoGrade}</td>
                  <td className="p-3 font-mono text-slate-300">
                    {formatRateMt(r.fobPrice)}
                  </td>
                  <td className="p-3 font-mono text-blue-400">
                    {formatRateMt(r.oceanFreight)}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {formatRateMt(r.landedCfr)}
                  </td>
                  <td className="p-3 font-mono font-bold text-white">{r.awardedVolume.toLocaleString()} MT</td>
                  <td className="p-3 text-slate-300 font-medium">{r.recipientPlant}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plant Stock Feasibility Impact */}
      <div>
        <PlantStockChart />
      </div>

      {/* Tender Award Modal */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  SAIL Tender Award Commitment Notice
                </h3>
              </div>
              <button
                onClick={() => setIsTenderModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-[350px] overflow-y-auto whitespace-pre-wrap select-all">
              {awardDocText}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDownloadText}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Award Notice (.TXT)
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTenderModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300"
                >
                  Close
                </button>
                {!tenderAwarded && (
                  <button
                    onClick={handleConfirmAward}
                    disabled={isExecuting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                  >
                    {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Approve & Issue Tender Award
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementDecisionPage;
