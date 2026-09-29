/**
 * JAL TARANG — Centralized UI Configuration Store (Zustand)
 * Manages dynamically fetched configurations from GET /api/v1/config/ui:
 * - Time horizons
 * - Data lineage pipeline stages
 * - Contract statuses
 * - Role-based copilot questions and options
 * - Standard report templates
 * - Plant buffer criteria
 */

import { create } from 'zustand';
import { configApi, UiConfigResponse } from '../api/configApi';

interface ConfigState {
  config: UiConfigResponse | null;
  horizons: Array<{ value: string; label: string }>;
  lineageStages: Array<{ id: string; label: string; items: string[]; color: string }>;
  contractStatuses: string[];
  roleOptions: Array<{ role: string; label: string; icon: string }>;
  roleQuestions: Record<string, string[]>;
  reportTemplates: Array<{
    id: string;
    roleCategory: string[];
    title: string;
    category: string;
    description: string;
    frequency: string;
    format: string;
  }>;
  plantSafeBuffers: Record<string, number>;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

const DEFAULT_HORIZONS = [
  { value: '7', label: '7 Days Forward' },
  { value: '14', label: '14 Days Forward' },
  { value: '30', label: '30 Days Forward' },
  { value: '60', label: '60 Days Forward' },
  { value: '90', label: '90 Days Forward' },
  { value: '180', label: '180 Days Forward' },
];

const DEFAULT_LINEAGE = [
  { id: 'source', label: 'Data Sources', items: ['Baltic Exchange', 'AIS Fleet Feeds', 'Port Authority APIs', 'Weather APIs'], color: '#64748B' },
  { id: 'ingest', label: 'Ingestion Layer', items: ['REST Webhooks', 'WebSocket Streams', 'Schema Validation', 'Deduplication'], color: '#0284C7' },
  { id: 'features', label: 'Feature Engineering', items: ['Rolling Averages', 'Seasonality Decomp', 'Volatility Index', 'Port Congestion Score'], color: '#8B5CF6' },
  { id: 'model', label: 'ML Models', items: ['ENSEMBLE-v2.1', 'LSTM Neural Network', 'XGBoost + ARIMA', 'Backtesting Engine'], color: '#F59E0B' },
  { id: 'forecast', label: 'Forecasts', items: ['7D / 14D / 30D / 60D', '95% Confidence Bands', 'Volatility Ranges', 'Route-level Predictions'], color: '#10B981' },
  { id: 'decision', label: 'Decision Engine', items: ['Market Entry Signal', 'Vessel Optimization', 'Charter Strategy', 'Risk Assessment'], color: '#EF4444' },
  { id: 'fixture', label: 'Fixture / Contract', items: ['Contract Draft', 'Approval Workflow', 'Audit Trail', 'Immutable Record'], color: '#0284C7' },
];

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  horizons: DEFAULT_HORIZONS,
  lineageStages: DEFAULT_LINEAGE,
  contractStatuses: ['ALL', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'PENDING_APPROVAL', 'CANCELLED'],
  roleOptions: [],
  roleQuestions: {},
  reportTemplates: [],
  plantSafeBuffers: { BSP: 21, BSL: 21, RSP: 21, DSP: 21, ISP: 21 },
  loaded: false,
  loading: false,
  error: null,

  fetchConfig: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true, error: null });

    try {
      const data = await configApi.getUiConfig();
      set({
        config: data,
        horizons: data.horizons?.length ? data.horizons : DEFAULT_HORIZONS,
        lineageStages: data.lineageStages?.length ? data.lineageStages : DEFAULT_LINEAGE,
        contractStatuses: data.contractStatuses?.length ? data.contractStatuses : get().contractStatuses,
        roleOptions: data.roleOptions || [],
        roleQuestions: data.roleQuestions || {},
        reportTemplates: data.reportTemplates || [],
        plantSafeBuffers: data.plantSafeBuffers || get().plantSafeBuffers,
        loaded: true,
        loading: false,
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || 'Failed to fetch UI configuration',
      });
    }
  },
}));
