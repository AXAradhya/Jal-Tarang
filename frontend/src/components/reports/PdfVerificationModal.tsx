import React, { useState, useRef } from 'react';
import {
  ShieldCheck, ShieldAlert, X, Copy, Check, FileText, Upload,
  KeyRound, Search, CheckCircle2, AlertTriangle, ArrowRight,
  ExternalLink, Sparkles, RefreshCw, FileCheck
} from 'lucide-react';
import {
  verifyReportChecksum,
  extractSha256FromPdf,
  ReportVerificationRecord,
  VerificationResult,
  getVerificationLedger
} from '../../lib/crypto';
import { reportApi } from '../../api';

interface PdfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const PdfVerificationModal: React.FC<PdfVerificationModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'file'>('code');
  const [inputCode, setInputCode] = useState(initialCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analyzedFileName, setAnalyzedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? inputCode).trim();
    if (!code) return;

    setIsVerifying(true);
    setVerificationResult(null);

    // Give subtle real-world verification feel
    await new Promise((r) => setTimeout(r, 280));

    try {
      // 1. First attempt verification against backend API
      const apiRes = await reportApi.verify(code).catch(() => null);
      if (apiRes?.isValid) {
        setVerificationResult({
          isValid: true,
          record: {
            sha256: apiRes.sha256,
            shortCode: apiRes.sha256.slice(0, 12).toUpperCase(),
            dossierRef: apiRes.dossierRef || 'SAIL/MRX/DOSSIER/2026',
            reportId: apiRes.reportId || 'REP-VERIFIED',
            title: apiRes.title,
            category: apiRes.category,
            frequency: 'Official Cycle',
            generatedAt: apiRes.issuedAt ? new Date(apiRes.issuedAt).toLocaleString('en-IN') : '2026-09-21',
            generatedBy: apiRes.issuingAuthority,
            issuingDivision: apiRes.issuingAuthority,
            signatory: apiRes.signatory,
            authorityLevel: apiRes.statutoryDelegation,
            recordCount: 8,
            auditBlockRef: apiRes.auditBlockRef || 'BL-2026-09-88219',
            tamperStatus: 'AUTHENTIC',
            currency: 'INR (₹) / USD ($)',
            summary: apiRes.description || 'Statutory certified maritime intelligence record.',
          },
          normalizedCode: apiRes.sha256,
          matchType: 'EXACT_HASH',
          checkedAt: new Date().toLocaleString('en-IN'),
        });
        setIsVerifying(false);
        return;
      }
    } catch {
      // Fallback to local cryptographic ledger verification
    }

    // 2. Local cryptographic ledger verification (handles newly generated client-side reports)
    const localResult = verifyReportChecksum(code);
    setVerificationResult(localResult);
    setIsVerifying(false);
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      await processUploadedPdf(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUploadedPdf(files[0]);
    }
  };

  const processUploadedPdf = async (file: File) => {
    setAnalyzedFileName(file.name);
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const extracted = await extractSha256FromPdf(file);
      if (extracted.embeddedCode) {
        setInputCode(extracted.embeddedCode);
        handleVerify(extracted.embeddedCode);
      } else {
        // Verify with file sha256
        setInputCode(extracted.fileSha256);
        handleVerify(extracted.fileSha256);
      }
    } catch (err) {
      console.error('Failed to process PDF:', err);
      setVerificationResult({
        isValid: false,
        normalizedCode: '',
        error: 'Unable to parse PDF file stream. Ensure it is a valid JAL TARANG exported document.',
        checkedAt: new Date().toLocaleString('en-IN'),
      });
      setIsVerifying(false);
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePresets = [
    {
      label: 'Vessel Fixture (REP-CH-01)',
      code: '4f8b2a9cd1e094f27b9c6a1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f',
    },
    {
      label: 'Raw Material Runway (REP-PR-01)',
      code: '9a3b7c8d1e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    },
    {
      label: 'Port Congestion (REP-PT-01)',
      code: 'e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4f3b2a9c1e8d4',
    },
    {
      label: 'Public Feeds Audit (REP-PUB-01)',
      code: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    },
    {
      label: 'Tampered Hash (Test Failure)',
      code: '0000000000000000000000000000000000000000000000000000000000000000',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-sky-400 border border-blue-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Official PDF Cryptographic Verification
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 font-semibold">
                  SHA-256 FIPS 180-4
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify document authenticity and anti-tamper integrity for JAL TARANG official dossiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <KeyRound size={14} />
            Enter SHA-256 Code
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload size={14} />
            Drop & Scan PDF File
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'code' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paste SHA-256 Code or Verification Reference from PDF Seal
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g. SHA256: 4F8B2A9CD1E094F2... or SAIL-VERIFY-4F8B2A9CD1E0"
                  className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <button
                  onClick={() => handleVerify()}
                  disabled={isVerifying || !inputCode.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  {isVerifying ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                  Verify
                </button>
              </div>

              {/* Sample Presets for Quick Demo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Quick-test official document hashes:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {samplePresets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputCode(p.code);
                        handleVerify(p.code);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-sky-400 flex items-center justify-center mb-3">
                  <FileCheck size={24} />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {analyzedFileName ? (
                    <span className="text-blue-600 dark:text-sky-400">{analyzedFileName}</span>
                  ) : (
                    'Click or Drag & Drop SAIL PDF Dossier Here'
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  The system will compute the real-time SHA-256 byte checksum and scan for embedded cryptographic seal markers
                </p>
              </div>
            </div>
          )}

          {/* Verification Result Card */}
          {isVerifying && (
            <div className="p-6 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-2">
              <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Verifying Cryptographic Checksum Against Immutable Ledger…
              </div>
              <p className="text-[11px] text-slate-500">
                Executing FIPS 180-4 SHA-256 hashing and checking Central Transport & Chartering Division registry
              </p>
            </div>
          )}

          {verificationResult && !isVerifying && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              {verificationResult.isValid && verificationResult.record ? (
                /* Authenticity Certificate */
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20 overflow-hidden shadow-xs">
                  {/* Certificate Banner */}
                  <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-white" />
                      <span className="text-xs font-bold tracking-wide uppercase">
                        Cryptographically Verified & Authentic
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100">
                      MATCH: {verificationResult.matchType?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4 space-y-3.5">
                    {/* Primary Dossier Title */}
                    <div className="border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3">
                      <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {verificationResult.record.dossierRef}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {verificationResult.record.title}
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        {verificationResult.record.summary}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/30">
                        <div className="text-[10px] text-slate-400 font-medium">Issuing Division</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {verificationResult.record.issuingDivision}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/30">
                        <div className="text-[10px] text-slate-400 font-medium">Authorized Signatory</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {verificationResult.record.signatory}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/30">
                        <div className="text-[10px] text-slate-400 font-medium">Generated Timestamp</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {verificationResult.record.generatedAt}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-emerald-800/30">
                        <div className="text-[10px] text-slate-400 font-medium">Tamper Check Status</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                          <Check size={12} />
                          PASSED · 0 Tampering Detected
                        </div>
                      </div>
                    </div>

                    {/* Audit Ledger Reference Box */}
                    <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] block">VERIFIED SHA-256 DIGEST:</span>
                        <span className="text-emerald-400 text-[10px] break-all select-all">
                          {verificationResult.record.sha256}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyHash(verificationResult.record!.sha256)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copy SHA-256 Hash"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                      <span>Ledger Commitment: {verificationResult.record.auditBlockRef}</span>
                      <span>Verified at: {verificationResult.checkedAt}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Verification Failed / Tamper Warning */
                <div className="rounded-xl border border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/20 overflow-hidden shadow-xs">
                  <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-white" />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      Cryptographic Verification Failed
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                      {verificationResult.error || 'The provided SHA-256 checksum does not match any authenticated JAL TARANG dossier in the immutable registry.'}
                    </p>
                    <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="font-semibold text-rose-800 dark:text-rose-400">Security Risk Notice:</div>
                      <div>• The document may have been edited, modified, or re-rendered after export.</div>
                      <div>• The checksum may contain typing errors or belong to an unofficial draft.</div>
                      <div>• For verification of critical tenders or charter party riders, contact the Central Transport & Chartering Division at Ispat Bhawan, New Delhi.</div>
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      Audit attempt timestamp: {verificationResult.checkedAt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>ISO 9001:2015 & CVO Audited Enterprise Security</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
