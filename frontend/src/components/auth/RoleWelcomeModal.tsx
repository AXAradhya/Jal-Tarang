import React, { useState } from 'react';
import {
  Shield,
  Ship,
  Package,
  Anchor,
  BarChart3,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { SystemRole } from '../../types';

export interface RoleDetail {
  role: SystemRole;
  title: string;
  department: string;
  badge: string;
  imageFileName: string;
  icon: React.ReactNode;
  mandate: string;
  responsibilities: string[];
  authorizedDecisions: string[];
  accessibleModules: string[];
  aiImagePrompt: string;
}

export const ROLE_DETAILS: Record<SystemRole, RoleDetail> = {
  CHARTERING_MANAGER: {
    role: 'CHARTERING_MANAGER',
    title: 'Chief Chartering Manager',
    department: 'Central Shipping & Maritime Logistics Division',
    badge: 'Maritime Operations Authority',
    imageFileName: 'chartering_manager.png',
    icon: <Ship className="w-6 h-6 text-blue-500" />,
    mandate:
      'Direct and optimize SAIL’s global dry-bulk vessel fixtures, voyage charters, and long-term Contracts of Affreightment (CoA) across major maritime trade lanes (Australia, Indonesia, South Africa, USA to Indian East Coast Ports). Maintain Baltic benchmark parity and minimize voyage demurrage.',
    responsibilities: [
      'Fixture evaluation and commercial counter-offer negotiations for Capesize, Panamax, and Supramax vessels.',
      'Monitoring Baltic Dry Index (BCI, BPI, BSI) and FFA forward curves to time spot market entries.',
      'Enforcing laycan compliance, demurrage mitigation protocols, and Gencon charter party covenants.',
      'Coordinating consolidated bulk shipments to maximize vessel deadweight utilization.',
    ],
    authorizedDecisions: [
      'Issue Binding Commercial Counter-Offers to Shipowners',
      'Authorize Vessel Fixtures up to $50M Valuation',
      'Execute Spot & CoA Laycan Modifications',
      'Approve Demurrage & Despatch Final Accounts',
    ],
    accessibleModules: [
      'Chartering Command Desk',
      'Freight Rate Intelligence & Forward Curves',
      'Global Fleet Telemetry & AIS Tracking',
      'Contract & Fixture Management',
      'Vessel Recommendation Engine',
    ],
    aiImagePrompt:
      'Photorealistic cinematic wide-angle photograph of a senior Indian maritime chartering executive at the Steel Authority of India Limited (SAIL) shipping command center in New Delhi, dressed in formal Indian corporate business attire, analyzing multi-monitor displays showing global dry-bulk Capesize shipping routes between Australia and India, Baltic Dry Index telemetry, vessel AIS tracking radars, high-tech maritime logistics command room with glass partitions, warm ambient corporate lighting, ultra-realistic 8k, professional executive portrait.',
  },
  PROCUREMENT_MANAGER: {
    role: 'PROCUREMENT_MANAGER',
    title: 'Director of Raw Materials Procurement',
    department: 'Central Coal & Mineral Supply Chain Directorate',
    badge: 'Strategic Sourcing Authority',
    imageFileName: 'procurement_manager.png',
    icon: <Package className="w-6 h-6 text-emerald-500" />,
    mandate:
      'Strategically procure metallurgical coking coal, PCI coal, and iron ore for all 5 SAIL integrated steel plants (Bhilai, Rourkela, Bokaro, Durgapur, IISCO Burnpur). Optimize total Landed CFR costs by synthesizing FOB mining tenders with maritime freight curves while maintaining mandatory plant stockpile safety buffers (21+ days).',
    responsibilities: [
      'Global supplier tender evaluation, allocation optimization, and long-term supply agreement administration.',
      'Monitoring plant buffer stocks and triggering automated replenishment requisitions before critical stockouts.',
      'Evaluating global FOB benchmark price trends (Argus, Platts) against ocean freight volatility.',
      'Executing supplier risk diversification to eliminate single-origin supply chain vulnerabilities.',
    ],
    authorizedDecisions: [
      'Commit & Issue Official Global Tender Awards',
      'Approve Quarterly Raw Material Supplier Split Allocations',
      'Adjust Mandatory Plant Buffer Inventory Thresholds',
      'Authorize Emergency Stockpile Replenishment Orders',
    ],
    accessibleModules: [
      'Procurement Optimization Dashboard',
      'Plant Stockpile Buffer Telemetry',
      'Global Supplier Allocation Decision Center',
      'Automated Cargo Requisition Wizard',
      'Supply Chain Risk & Disruption Matrix',
    ],
    aiImagePrompt:
      'Photorealistic cinematic photograph of an executive Director of Raw Materials Procurement at a modern Indian steel conglomerate headquarters, examining high-grade metallurgical coking coal and iron ore logistics procurement schedules, tablet displaying supplier allocation optimization algorithms and international trade finance tenders, background showing illuminated architectural steel plant models and maritime port charts, corporate executive suit, authoritative and visionary, hyper-realistic 8k.',
  },
  PORT_MANAGER: {
    role: 'PORT_MANAGER',
    title: 'Chief Port Logistics Officer',
    department: 'Eastern Coastal Terminal & Berth Management Division',
    badge: 'Discharge & Port Operations Authority',
    imageFileName: 'port_manager.png',
    icon: <Anchor className="w-6 h-6 text-cyan-500" />,
    mandate:
      'Command discharge operations, berth allocations, and rail evacuation across Indian deepwater ports (Visakhapatnam, Paradip, Haldia, Dhamra, Gangavaram). Minimize vessel pre-berthing waiting times, eliminate port congestion surcharges, and accelerate rake dispatch to inland steel plants.',
    responsibilities: [
      'Real-time berth scheduling and tidal draft management for Capesize and Baby-Cape bulk carriers.',
      'Monitoring port waiting queues, berth occupancy ratios, and gantry unloader discharge rates (MT/day).',
      'Coordinating with Indian Railways for rake placement and rapid evacuation of discharged metallurgical coal.',
      'Enforcing weather safety protocols during Bay of Bengal cyclone warnings and monsoon swells.',
    ],
    authorizedDecisions: [
      'Confirm Berth Priority & Pilotage Orders',
      'Reroute Inbound Vessels between Congested Coastal Ports',
      'Authorize Overtime Stevedoring & Fast-Discharge Bonuses',
      'Issue Port Evacuation Clearances to Indian Railways',
    ],
    accessibleModules: [
      'Port Logistics Intelligence Desk',
      'Berth Allocation & Draft Matrix',
      'Live Coastal Weather & Cyclone Radar',
      'Railway Rake Turnaround Telemetry',
      'Port Congestion Alert System',
    ],
    aiImagePrompt:
      'Photorealistic dramatic photograph of a Chief Port Operations & Logistics Officer at Visakhapatnam Port or Paradip Port terminal command tower, overlooking massive Capesize dry-bulk gantry unloaders discharging metallurgical coal into automated railway rakes, safety helmet with SAIL port authority emblem, reflective high-visibility tactical executive jacket, holding an industrial ruggedized tablet with live berth allocation schedules and weather radar, sunrise coastal port background, ultra-sharp detail, photorealistic 8k.',
  },
  ANALYST: {
    role: 'ANALYST',
    title: 'Lead Quantitative Freight Econometrician',
    department: 'Maritime Data Science & Econometric Modeling Cell',
    badge: 'Predictive Intelligence Authority',
    imageFileName: 'analyst.png',
    icon: <BarChart3 className="w-6 h-6 text-amber-500" />,
    mandate:
      'Develop, validate, and fine-tune multi-horizon machine learning forecasting engines (Bi-LSTM, Prophet, Ensemble) and econometric forward curves. Conduct macroeconomic sensitivity stress testing (bunker shocks, geopolitical chokepoints, extreme weather) to guide chartering and procurement timing.',
    responsibilities: [
      'Generating 7, 14, 30, 90, and 180-day freight rate trajectory forecasts with 95% confidence intervals.',
      'Performing Monte Carlo voyage cost simulations under fuel price volatility and canal transit delays.',
      'Backtesting econometric model weights against 1,700+ historical Baltic fixture records.',
      'Synthesizing satellite vessel AIS movement, iron ore fixture volumes, and Chinese steel demand indices.',
    ],
    authorizedDecisions: [
      'Calibrate & Retrain Machine Learning Econometric Models',
      'Publish Forward Rate Trajectories to Decision Engines',
      'Define Macroeconomic Stress Shock Parameters',
      'Verify Model Confidence & Mean Absolute Error (MAE) Benchmarks',
    ],
    accessibleModules: [
      'Freight Econometrics & Machine Learning Center',
      'Multi-Route Forward Trajectory & Forward Curves',
      'Scenario Center & Monte Carlo Stress Testing',
      'Fuel Bunker & Emission Arbitrage Analyzer',
      'Model Accuracy & Feature Drift Monitor',
    ],
    aiImagePrompt:
      'Photorealistic photograph of a quantitative Maritime Freight Econometrician and Data Scientist at a modern Indian financial intelligence lab, sitting in front of curved Bloomberg-style displays showing machine learning freight forward curves, Monte Carlo voyage risk simulations, fuel bunker volatility graphs, sophisticated data analytics workspace, notebook with differential equations and statistical models, focused intellectual demeanor, cinematic depth of field, 8k resolution.',
  },
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator & Security Governance Director',
    department: 'Ministry of Steel Enterprise Systems Directorate',
    badge: 'Root Governance Authority',
    imageFileName: 'super_admin.png',
    icon: <Shield className="w-6 h-6 text-purple-500" />,
    mandate:
      'Oversee the enterprise platform infrastructure, zero-trust cryptographic audit ledgers, role-based access control (RBAC), and multi-tenant security architecture. Ensure 100% compliance with Government of India public procurement guidelines, CVC standards, and maritime chartering governance covenants.',
    responsibilities: [
      'Managing user security credentials, profile assignments, and cryptographic audit signatures.',
      'Monitoring system telemetry, PostgreSQL connectivity, background ML inference daemons, and database integrity.',
      'Enforcing immutable audit logging on all counter-offers, tender awards, and contract signatures.',
      'Overseeing platform API rate limits, backup snapshots, and disaster recovery readiness.',
    ],
    authorizedDecisions: [
      'Grant Enterprise System Roles & Clearance Credentials',
      'Audit & Invalidate Questionable Contract Fixtures',
      'Purge and Re-index Model Cache & Historical Databases',
      'Enforce Zero-Trust Security Policies across Platform Nodes',
    ],
    accessibleModules: [
      'Enterprise Platform Governance & Security Center',
      'Immutable Audit Trail & Cryptographic Verification',
      'System Telemetry, PostgreSQL & Worker Health',
      'User Management & Role Configuration',
      'Comprehensive Executive Reports & PDF Dossiers',
    ],
    aiImagePrompt:
      'Photorealistic cinematic photograph of a Chief Enterprise Systems Security and Governance Director at the central Ministry of Steel cloud infrastructure operations center, monitoring national bulk cargo supply chain security, cryptographically signed contract audit ledgers, zero-trust RBAC access controls, high-tech server racks in the background with glowing blue and emerald status LEDs, confident authoritative cybersecurity leader, cinematic lighting, 8k.',
  },
  ADMIN: {
    role: 'ADMIN',
    title: 'Enterprise Administrator',
    department: 'Enterprise Information Systems Directorate',
    badge: 'Administrative Governance',
    imageFileName: 'super_admin.png',
    icon: <Shield className="w-6 h-6 text-purple-500" />,
    mandate:
      'Administer enterprise workflows, user role integrity, and master reference catalogs. Maintain compliance with corporate chartering covenants and operational reporting standards across all integrated plants and ports.',
    responsibilities: [
      'Maintaining user accounts, operational roles, and department allocations.',
      'Reviewing platform audit trails, exception reports, and system performance benchmarks.',
      'Coordinating cross-departmental data synchronization between procurement, chartering, and ports.',
    ],
    authorizedDecisions: [
      'Manage User Role Clearances',
      'Export Official PDF Executive Dossiers',
      'Review System Audit Logs',
    ],
    accessibleModules: [
      'Enterprise Administration Desk',
      'Audit Logs & User Registry',
      'Executive Dossier & PDF Reports',
    ],
    aiImagePrompt:
      'Photorealistic cinematic photograph of a Chief Enterprise Systems Security and Governance Director at the central Ministry of Steel cloud infrastructure operations center, monitoring national bulk cargo supply chain security, cryptographically signed contract audit ledgers, zero-trust RBAC access controls, high-tech server racks in the background with glowing blue and emerald status LEDs, confident authoritative cybersecurity leader, cinematic lighting, 8k.',
  },
};

interface RoleWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: SystemRole;
  userName?: string;
}

export const RoleWelcomeModal: React.FC<RoleWelcomeModalProps> = ({
  isOpen,
  onClose,
  role,
  userName = 'Executive Officer',
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  if (!isOpen) return null;

  const details = ROLE_DETAILS[role] || ROLE_DETAILS.CHARTERING_MANAGER;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(details.aiImagePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-white relative overflow-hidden border-b border-slate-700/60">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-md">
                {details.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs select-none">🇮🇳</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-blue-200">
                    Government of India · Ministry of Steel
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-0.5 tracking-tight">
                  {details.title}
                </h2>
                <p className="text-xs text-slate-300 font-medium">{details.department}</p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Lock size={10} />
                Profile Role Locked
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-5 text-xs">
          {/* Welcome Greeting & Core Mandate */}
          <div className="p-4 bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/60 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Welcome, {userName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300">
                Commissioned Mandate
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {details.mandate}
            </p>
          </div>

          {/* Operational Responsibilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-blue-500" />
              Core Responsibilities & Operational Scope
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.responsibilities.map((resp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-lg flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 mt-1.5 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 leading-normal">{resp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Authorized Decision Powers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-500" />
              Executive Decision Authority
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.authorizedDecisions.map((dec, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-medium"
                >
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Image Generation Prompt Card */}
          <div className="p-4 bg-gradient-to-br from-purple-500/5 via-slate-50 to-indigo-500/5 dark:from-purple-950/30 dark:via-slate-800/50 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Executive Role Portrait Prompt
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                  AI Ready
                </span>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
              >
                {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy Image Prompt'}</span>
              </button>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Use this curated prompt in Midjourney, Imagen, or DALL-E to generate an official 8K executive portrait for this role:
            </p>

            <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[10.5px] leading-relaxed select-all">
              {details.aiImagePrompt}
            </div>
          </div>

          {/* Security & Immutability Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 p-2.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-lg">
            <Info size={14} className="shrink-0 text-slate-400" />
            <span>
              This role is tied to your cryptographic security token and enterprise profile. Role changes cannot be casually made in the dashboard and require Central Administration clearance.
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Mandate verified by SAIL Central Governance
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Acknowledge Mandate & Enter Command Center</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
