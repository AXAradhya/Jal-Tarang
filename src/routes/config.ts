/**
 * JAL TARANG — Centralized UI Configuration API
 * GET /api/v1/config/ui
 * 
 * Provides dynamic, data-driven configurations for frontend dashboards,
 * navigation, report templates, lineage diagrams, and role-based copilot questions.
 */

import { Router, Request, Response } from 'express';
import { SystemRole } from '../types/index.js';

export const configRouter = Router();

const HORIZON_OPTIONS = [
  { value: '7', label: '7 Days Forward' },
  { value: '14', label: '14 Days Forward' },
  { value: '30', label: '30 Days Forward' },
  { value: '60', label: '60 Days Forward' },
  { value: '90', label: '90 Days Forward' },
  { value: '180', label: '180 Days Forward' },
];

const LINEAGE_STAGES = [
  { id: 'source', label: 'Data Sources', items: ['Baltic Exchange BDI/BCI/BPI', 'AIS Vessel Tracking', 'Port Authority APIs', 'Weather APIs (IMD)'], color: '#64748B' },
  { id: 'ingest', label: 'Ingestion Layer', items: ['CSV/JSON Upload', 'REST Webhooks', 'Schema Validation', 'Deduplication'], color: '#0284C7' },
  { id: 'features', label: 'Feature Engineering', items: ['Rolling Averages (7/30/90D)', 'Seasonality Decomp', 'Volatility Index', 'Port Congestion Score'], color: '#8B5CF6' },
  { id: 'model', label: 'ML Models', items: ['ENSEMBLE-v2.1', 'LSTM Neural Network', 'XGBoost + ARIMA', 'Backtesting Engine'], color: '#F59E0B' },
  { id: 'forecast', label: 'Forecasts', items: ['7D / 14D / 30D / 60D', '95% Confidence Bands', 'Volatility Ranges', 'Route-level Predictions'], color: '#10B981' },
  { id: 'decision', label: 'Decision Engine', items: ['Market Entry Signal', 'Vessel Optimization', 'Charter Strategy', 'Risk Assessment'], color: '#EF4444' },
  { id: 'fixture', label: 'Fixture / Contract', items: ['Contract Draft', 'Approval Workflow', 'Audit Trail', 'Immutable Record'], color: '#0284C7' },
];

const CONTRACT_STATUSES = [
  'ALL',
  'ACTIVE',
  'CONFIRMED',
  'COMPLETED',
  'PENDING_APPROVAL',
  'CANCELLED',
];

const ROLE_OPTIONS = [
  { role: SystemRole.CHARTERING_MANAGER, label: 'Chartering Manager', icon: 'Anchor' },
  { role: SystemRole.PROCUREMENT_MANAGER, label: 'Procurement Manager', icon: 'Package' },
  { role: SystemRole.PORT_MANAGER, label: 'Port Manager', icon: 'MapPin' },
  { role: SystemRole.ANALYST, label: 'Freight Analyst', icon: 'TrendingUp' },
  { role: SystemRole.SUPER_ADMIN, label: 'Super Admin', icon: 'Shield' },
  { role: SystemRole.ADMIN, label: 'Admin', icon: 'ShieldCheck' },
];

const ROLE_QUESTIONS: Record<string, string[]> = {
  [SystemRole.CHARTERING_MANAGER]: [
    'What are my key responsibilities as Chartering Manager?',
    'Which pages and tools are dedicated to my role?',
    'Run a voyage economics analysis for 100,000 MT Coking Coal at current market rates',
    'Which candidate vessels are available in the fleet?',
    'What is the current C5TC freight rate and 30-day forecast?'
  ],
  [SystemRole.PROCUREMENT_MANAGER]: [
    'What is my role as Procurement Manager in JAL TARANG?',
    'Which pages should I monitor for raw material supply?',
    'What are the stock cushions across Bhilai and Bokaro steel plants?',
    'How does the Multi-Supplier Tender Allocation work in Decision Center?',
    'Explain FOB vs CFR landed cost procurement terms'
  ],
  [SystemRole.PORT_MANAGER]: [
    'What are my duties as Port Manager in JAL TARANG?',
    'Which pages are dedicated to port logistics and congestion?',
    'What are the current port restrictions and waiting days at Paradip?',
    'What is the feasibility of a Newcastlemax vessel at Paradip port?',
    'How much money is saved by diverting a vessel from Paradip to Dhamra?'
  ],
  [SystemRole.ANALYST]: [
    'What is my mandate as Quantitative Freight Analyst?',
    'Which pages are dedicated to forecasting and risk analytics?',
    'How does the Freight Forecasting module generate forward curves?',
    'How do the Ensemble Pro and Bi-LSTM models compare in MAE?',
    'Explain how the Scenario Center simulates market disruptions'
  ],
  [SystemRole.SUPER_ADMIN]: [
    'What is my executive oversight role as Super Admin?',
    'Which pages and governance modules can I access?',
    'Which COA contract amendments require board-level digital clearance?',
    'How does the immutable CVC audit trail work in JAL TARANG?',
    'Explain the complete end-to-end workflow of Decision Center'
  ],
  [SystemRole.ADMIN]: [
    'What administrative controls are available in JAL TARANG?',
    'How do I monitor system health, database pools, and Redis job queues?',
    'Show me the recent administrative audit log entries',
    'How do I manage user credentials and delegated authority limits?'
  ],
};

const PAGE_EXPLORATION_QUESTIONS = [
  'Tell me about the Decision Center (/decision)',
  'Explain the Operations Control Tower (/control-tower)',
  'How does Freight Forecasting (/forecasting) work?',
  'What is on the Chartering & Vessels (/chartering) page?',
  'Explain the Procurement Dashboard (/procurement)',
  'What does the Port Intelligence (/ports) module do?',
  'How does the Scenario Center (/scenarios) work?',
  'Explain the Risk Engine (/risk)'
];

const REPORT_TEMPLATES = [
  {
    id: 'REP-CH-01',
    roleCategory: ['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
    title: 'Vessel Fixture & TCE Audit',
    category: 'Chartering',
    description: 'Comprehensive audit of fleet fixtures, TCE earnings, and spot charter performance from live database.',
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
    description: 'Turnaround times, pre-berthing waiting days, and congestion indicators for Paradip, Haldia, Vizag, and Dhamra.',
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
    id: 'REP-RC-01',
    roleCategory: ['SUPER_ADMIN', 'ADMIN', 'CHARTERING_MANAGER', 'PROCUREMENT_MANAGER'],
    title: 'CVC Regulatory Compliance & Audit Log',
    category: 'Risk & Governance',
    description: 'Immutable trail of charterparty sign-offs, counter-offers, and delegated authority approvals.',
    frequency: 'Monthly',
    format: 'PDF',
  },
  {
    id: 'REP-AN-01',
    roleCategory: ['ANALYST', 'SUPER_ADMIN', 'ADMIN'],
    title: 'Freight Econometric Accuracy & Backtesting',
    category: 'Market Analytics',
    description: 'Mean Absolute Error (MAE), RMSE, and directional accuracy metrics across 7D to 180D models.',
    frequency: 'Monthly',
    format: 'PDF',
  },
];

const PLANT_SAFE_BUFFERS = {
  'Bhilai Steel Plant (BSP)': 21,
  'Bokaro Steel Plant (BSL)': 21,
  'Rourkela Steel Plant (RSP)': 21,
  'Durgapur Steel Plant (DSP)': 21,
  'IISCO Steel Plant (ISP)': 21,
};

// GET /api/v1/config/ui
configRouter.get('/ui', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      horizons: HORIZON_OPTIONS,
      lineageStages: LINEAGE_STAGES,
      contractStatuses: CONTRACT_STATUSES,
      roleOptions: ROLE_OPTIONS,
      roleQuestions: ROLE_QUESTIONS,
      pageExplorationQuestions: PAGE_EXPLORATION_QUESTIONS,
      reportTemplates: REPORT_TEMPLATES,
      plantSafeBuffers: PLANT_SAFE_BUFFERS,
      serverTime: new Date().toISOString(),
    },
  });
});
