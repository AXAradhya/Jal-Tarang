import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { SystemRole } from '../../types';
import { DataFreshnessBar } from '../../components/common';
import {
  FileText, Download, Calendar, Filter, Printer,
  BarChart2, ShieldCheck, Clock, Ship, Package, Anchor,
  CheckCircle2, ArrowRight, Loader2, RefreshCw
} from 'lucide-react';
import { contractApi, auditApi, vesselApi, portApi, freightApi, configApi, reportApi, notificationApi } from '../../api';
import { generateSailPdfReport } from '../../lib/pdfReportGenerator';
import { generateSailCsvReport } from '../../lib/csvExport';
import { queryKeys } from '../../api/queryKeys';
import { PdfVerificationModal } from '../../components/reports/PdfVerificationModal';

const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentRole: SystemRole = user?.roles?.[0] || 'CHARTERING_MANAGER';
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string[]>([]);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedVerifyCode, setSelectedVerifyCode] = useState<string>('');

  // Fetch report template definitions from config API
  const { data: uiConfig } = useQuery({
    queryKey: queryKeys.config.ui,
    queryFn: () => configApi.getUiConfig(),
    staleTime: 300_000,
  });

  const { data: rawContracts } = useQuery({
    queryKey: queryKeys.contracts.list({}),
    queryFn: async () => {
      const res = await contractApi.list({ limit: 100 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const { data: rawAudit } = useQuery({
    queryKey: queryKeys.audit.logs({ limit: 50 }),
    queryFn: async () => {
      const res = await auditApi.logs({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const { data: rawVessels } = useQuery({
    queryKey: queryKeys.vessels.list({}),
    queryFn: async () => {
      const res = await vesselApi.list({ limit: 100 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const { data: rawPorts } = useQuery({
    queryKey: queryKeys.ports.list({}),
    queryFn: async () => {
      const res = await portApi.list({ limit: 20 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const { data: rawRates } = useQuery({
    queryKey: queryKeys.freight.rates(),
    queryFn: async () => {
      const res = await freightApi.rates({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const contracts = rawContracts || [];
  const auditLogs = rawAudit || [];
  const vessels = rawVessels || [];
  const ports = rawPorts || [];
  const rates = rawRates || [];

  // Build report templates dynamically from backend config API
  const rawTemplates = uiConfig?.reportTemplates || [];
  const reportTemplates = (rawTemplates.length > 0 ? rawTemplates : [
    {
      id: 'REP-CH-01',
      roleCategory: ['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'Vessel Fixture & TCE Audit',
      category: 'Chartering',
      description: 'Audit of fleet fixtures, TCE performance, and spot charter executions.',
      frequency: 'Weekly',
      format: 'PDF',
    },
    {
      id: 'REP-CH-02',
      roleCategory: ['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'Laycan Compliance & Demurrage Liability',
      category: 'Chartering',
      description: 'Laycan adherence tracking, demurrage risk exposure, and dispatch earnings calculations.',
      frequency: 'Monthly',
      format: 'Excel',
    },
    {
      id: 'REP-PR-01',
      roleCategory: ['PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'SAIL Steel Plants Raw Material Runway',
      category: 'Procurement',
      description: 'Stock buffer status across 5 integrated steel plants against the 21-day statutory threshold.',
      frequency: 'Weekly',
      format: 'Excel',
    },
    {
      id: 'REP-PR-02',
      roleCategory: ['PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'Supplier Performance & COA Fulfillment',
      category: 'Procurement',
      description: 'Fulfillment rates computed from delivered vs target contracted volumes across counterparties.',
      frequency: 'Monthly',
      format: 'PDF',
    },
    {
      id: 'REP-PT-01',
      roleCategory: ['PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'East Coast Port Congestion Analysis',
      category: 'Port Operations',
      description: 'Turnaround times, pre-berthing waiting days, and congestion indicators for Indian ports.',
      frequency: 'Daily',
      format: 'PDF',
    },
    {
      id: 'REP-PT-02',
      roleCategory: ['PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'Pre-Berthing Wait & Demurrage Prevention',
      category: 'Port Operations',
      description: 'Identification of bottlenecks causing demurrage and economic feasibility of diversion.',
      frequency: 'Weekly',
      format: 'Excel',
    },
    {
      id: 'REP-PUB-01',
      roleCategory: ['CHARTERING_MANAGER', 'PROCUREMENT_MANAGER', 'PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
      title: 'Ministry of Steel — Public Feeds & Sagarmala Logistics Audit',
      category: 'Executive Audit',
      description: 'Official statutory audit of 8 zero-cost public data feeds (Data.gov.in, IMD Cyclone, Open-Meteo, ECB FX, World Bank, FRED, UN Comtrade, AISStream) with SLA latency and $48,000/yr savings verification.',
      frequency: 'Daily',
      format: 'PDF',
    },
  ]).map((t: any) => ({
    id: t.id,
    roleCategory: (t.roleCategory || ['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN']) as SystemRole[],
    title: t.title,
    category: t.category as any,
    description: t.description,
    frequency: t.frequency as any,
    lastGenerated: contracts.length > 0 ? 'Data available' : 'No data in DB',
    format: t.format as any,
    dataCount: t.id.includes('CH') ? vessels.length + contracts.length :
               t.id.includes('PR') ? contracts.length :
               t.id.includes('PT') ? ports.length :
               t.id.includes('MI') ? rates.length : auditLogs.length,
  }));

  const visibleReports = reportTemplates.filter((r) =>
    r.roleCategory.includes(currentRole) || currentRole === 'SUPER_ADMIN'
  );

  const categoryColors: Record<string, string> = {
    'Chartering': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300',
    'Procurement': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'Port Operations': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    'Risk & Compliance': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    'Market Intelligence': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'Executive Audit': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  const handleGenerate = async (reportItem: any) => {
    setGenerating(reportItem.id);
    try {
      await reportApi.generate({
        reportType: reportItem.id,
        format: reportItem.format || 'PDF',
      });
      setGenerated((prev) => Array.from(new Set([...prev, reportItem.id])));

      // Instantly generate and trigger download of the beautifully designed PDF report
      generateSailPdfReport({
        reportId: reportItem.id,
        title: reportItem.title,
        category: reportItem.category,
        description: reportItem.description,
        frequency: reportItem.frequency,
        format: reportItem.format || 'PDF',
        contracts,
        vessels,
        ports,
        rates,
        auditLogs,
      });

      notificationApi.create({
        title: `Official Report Generated: ${reportItem.title}`,
        message: `Compiled from verified database records. PDF downloaded with cryptographic checksum.`,
        role: 'ALL',
        severity: 'INFO',
        category: 'SYSTEM',
      }).then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
    } catch (err) {
      console.warn('Backend report compile fallback:', err);
      // Fallback: still generate verified client PDF using live data
      generateSailPdfReport({
        reportId: reportItem.id,
        title: reportItem.title,
        category: reportItem.category,
        description: reportItem.description,
        frequency: reportItem.frequency,
        format: reportItem.format || 'PDF',
        contracts,
        vessels,
        ports,
        rates,
        auditLogs,
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = (reportItem: any) => {
    generateSailPdfReport({
      reportId: reportItem.id,
      title: reportItem.title,
      category: reportItem.category,
      description: reportItem.description,
      frequency: reportItem.frequency,
      format: reportItem.format || 'PDF',
      contracts,
      vessels,
      ports,
      rates,
      auditLogs,
    });
  };

  const handleDownloadExcel = (reportItem: any) => {
    generateSailCsvReport({
      reportId: reportItem.id,
      title: reportItem.title,
      category: reportItem.category,
      description: reportItem.description,
      frequency: reportItem.frequency,
      format: 'Excel',
      contracts,
      vessels,
      ports,
      rates,
      auditLogs,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-blue-600 dark:text-sky-400" size={22} />
              SAIL Executive Reports & Official Dossiers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Automated compilation of operational intelligence, contract status, vessel schedules, and audit records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <DataFreshnessBar source="Database Synced · Automated PDF Engine" />
            <button
              onClick={() => {
                setSelectedVerifyCode('');
                setIsVerifyModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-blue-600/40 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900 text-blue-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <ShieldCheck size={15} className="text-blue-600 dark:text-sky-400" />
              <span>Verify Official PDF</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Authorized Mandate:</span>
            <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-600 dark:text-sky-400" />
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[11px]">Displaying authorized dossiers for current profile clearance</span>
          </div>
        </div>
      </div>

      {/* Summary Stats from DB */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs text-center">
          <div className="text-xs text-slate-500 mb-1">Contracts in DB</div>
          <div className="text-2xl font-bold text-blue-600">{contracts.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs text-center">
          <div className="text-xs text-slate-500 mb-1">Vessels in DB</div>
          <div className="text-2xl font-bold text-emerald-600">{vessels.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs text-center">
          <div className="text-xs text-slate-500 mb-1">Audit Logs</div>
          <div className="text-2xl font-bold text-purple-600">{auditLogs.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs text-center">
          <div className="text-xs text-slate-500 mb-1">Freight Rates</div>
          <div className="text-2xl font-bold text-amber-600">{rates.length}</div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleReports.map((report) => {
          const isGenerating = generating === report.id;
          const isGenerated = generated.includes(report.id);
          const hasData = report.dataCount > 0;

          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${categoryColors[report.category] || 'bg-slate-100 text-slate-600'}`}>
                      {report.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{report.id}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{report.title}</h3>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  report.format === 'PDF' ? 'bg-red-50 text-red-600' :
                  report.format === 'Excel' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {report.format}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {report.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{report.frequency}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  <span>{report.lastGenerated}</span>
                </div>
                <div className={`font-semibold ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {hasData ? `${report.dataCount} records` : 'No data'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerate(report)}
                  disabled={isGenerating}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isGenerating
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {isGenerating ? (
                    <><Loader2 size={12} className="animate-spin" /> Compiling PDF…</>
                  ) : (
                    <><RefreshCw size={12} /> Generate & Download</>
                  )}
                </button>
                <button
                  onClick={() => handleDownload(report)}
                  title="Direct Download Official PDF Report"
                  className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download size={12} className="text-blue-600 dark:text-sky-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadExcel(report)}
                  title="Direct Download Official Excel / CSV Spreadsheet (FR-010)"
                  className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedVerifyCode(report.id);
                    setIsVerifyModalOpen(true);
                  }}
                  title="Verify Cryptographic Seal & SHA-256 for this report"
                  className="py-2 px-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <ShieldCheck size={12} className="text-purple-600 dark:text-purple-400" />
                  <span>Verify</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Log Preview */}
      {(currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Audit Logs (DB Preview)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{auditLogs.length} entries loaded</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 6).map((log: any, i: number) => (
                  <tr key={log.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {log.user_email || log.userEmail || log.user_id || '—'}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {log.action || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{log.entity_type || log.entityType || '—'}</td>
                    <td className="p-3 text-slate-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">No audit logs in database</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Cryptographic Verification Modal */}
      <PdfVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        initialCode={selectedVerifyCode}
      />
    </div>
  );
};

export default ReportsPage;
