import apiClient from './client';
import type { ApiResponse, DecisionAnalysisInput, DecisionRecommendationResult, UserSession, ChatSession } from '../types';

export const decisionApi = {
  analyze: async (input: DecisionAnalysisInput): Promise<DecisionRecommendationResult> => {
    const { data } = await apiClient.post<ApiResponse<DecisionRecommendationResult>>(
      '/decision/analyze',
      input
    );
    return data.data;
  },

  getRecommendations: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/decision/recommendations', { params });
    return data.data;
  },

  getRisks: async (params?: { destinationPortId?: string; destinationPortName?: string; contractDuration?: string; vesselDraftM?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/decision/risks', { params });
    return data.data;
  },

  getMarketWindows: async (params?: { freightCodeId?: string; baseFreightRate?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/decision/market-windows', { params });
    return data.data;
  },
};

export const vesselApi = {
  list: async (params?: {
    vesselClass?: string;
    status?: string;
    minDwt?: number;
    maxDwt?: number;
    flag?: string;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/vessels', { params });
    return data.data;
  },

  detail: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/vessels/${id}`);
    return data.data;
  },

  feasibility: async (vesselId: string, portId: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/vessels/${vesselId}/feasibility/${portId}`
    );
    return data.data;
  },
};

export const portApi = {
  list: async (params?: { country?: string; congestionStatus?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/ports', { params });
    return data.data;
  },

  detail: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/ports/${id}`);
    return data.data;
  },

  constraints: async (portId: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/ports/constraints/${portId}`);
    return data.data;
  },
};

export const freightApi = {
  rates: async (params?: { freightCode?: string; cargoType?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/freight/rates', { params });
    return data.data;
  },

  codes: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/freight/codes');
    return data.data;
  },

  history: async (code: string, params?: { days?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/freight/rates/${code}/history`, {
      params,
    });
    return data.data;
  },

  trajectory: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/freight/trajectory');
    return data.data;
  },

  syncLive: async () => {
    const { data } = await apiClient.post<ApiResponse<any>>('/freight/sync-live');
    return data.data;
  },

  trends: async (params?: { days?: number | string }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/freight/trends', { params });
    return data.data;
  },
};

export const forecastApi = {
  latest: async (freightCode: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/forecasts/latest/${freightCode}`);
    return data.data;
  },

  models: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/models');
    return data.data;
  },

  triggerForecast: async (payload: { freightCode: string; horizonDays: number }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/forecasts/trigger', payload);
    return data.data;
  },

  getMdpiEconometric: async (freightCode: string = 'FRT-C5TC', baseRateUsd?: number) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/forecasts/econometric/mdpi-2024', {
      params: { freightCode, baseRateUsd },
    });
    return data.data;
  },

  getElasticityAnalysis: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/forecasts/econometric/elasticity-analysis');
    return data.data;
  },

  simulateModalShift: async (payload: {
    freightRateChangePct: number;
    railTariffChangePct?: number;
    baseCargoVolumeMt?: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/forecasts/econometric/simulate-modal-shift', payload);
    return data.data;
  },
};

export const contractApi = {
  list: async (params?: { status?: string; contractType?: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/contracts', { params });
    return data.data;
  },

  detail: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/contracts/${id}`);
    return data.data;
  },

  create: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/contracts', payload);
    return data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/contracts/${id}/status`, {
      status,
      notes,
    });
    return data.data;
  },
};

export const riskApi = {
  dashboard: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/risks/dashboard');
    return data.data;
  },

  factors: async (params?: { level?: string; category?: string }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/risks', { params });
    return data.data;
  },

  activeDisruptions: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/risks/nlp/active');
    return data.data;
  },

  scoreNlp: async (payload: { headline: string; bodyText?: string }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/risks/nlp/score', payload);
    return data.data;
  },

  summary: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/risks/summary');
    return data.data;
  },
};

export const scenarioApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/scenarios');
    return data.data;
  },

  run: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/scenarios/${id}/run`);
    return data.data;
  },

  create: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/scenarios', payload);
    return data.data;
  },
};

export const copilotApi = {
  query: async (payload: {
    query: string;
    sessionId?: string;
    role?: string;
    currentRole?: string;
    page?: string;
    currency?: string;
    context?: any;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/copilot/query', payload);
    return data.data;
  },
};

export const copilotSessionApi = {
  list: async (role?: string): Promise<ChatSession[]> => {
    const { data } = await apiClient.get<ApiResponse<ChatSession[]>>('/copilot/sessions', {
      params: { role },
    });
    return data.data;
  },
  save: async (session: Partial<ChatSession> & { id: string; title: string }): Promise<ChatSession> => {
    const { data } = await apiClient.post<ApiResponse<ChatSession>>('/copilot/sessions', session);
    return data.data;
  },
  update: async (id: string, updates: { title?: string; isPinned?: boolean }): Promise<ChatSession> => {
    const { data } = await apiClient.patch<ApiResponse<ChatSession>>(`/copilot/sessions/${id}`, updates);
    return data.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const { data } = await apiClient.delete<ApiResponse<{ id: string }>>(`/copilot/sessions/${id}`);
    return data.data;
  },
  clear: async (): Promise<{ count: number }> => {
    const { data } = await apiClient.delete<ApiResponse<{ count: number }>>('/copilot/sessions');
    return data.data;
  },
};

export const notificationApi = {
  list: async (params?: { role?: string; unreadOnly?: boolean; severity?: string; category?: string }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/notifications', { params });
    return data;
  },
  summary: async (role?: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/notifications/summary', { params: { role } });
    return data.data;
  },
  create: async (payload: {
    title: string;
    message: string;
    role?: string;
    severity?: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
    category?: string;
    link?: string;
    metadata?: any;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/notifications', payload);
    return data.data;
  },
  markRead: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/notifications/${id}/read`);
    return data.data;
  },
  markAllRead: async (role?: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/notifications/mark-all-read', { role });
    return data.data;
  },
  acknowledge: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/notifications/${id}/acknowledge`);
    return data.data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/notifications/${id}`);
    return data;
  },
  getRandom: async (role?: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/notifications/random', { params: { role } });
    return data.data;
  },
  categories: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/notifications/categories');
    return data.data;
  },
};

export const jobApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/jobs');
    return data.data;
  },
};

export const auditApi = {
  logs: async (params?: { entity?: string; action?: string; userId?: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/audit', { params });
    return data.data;
  },
  stats: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/audit/stats');
    return data.data;
  },
};

export const reportApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/reports');
    return data.data;
  },
  generate: async (payload: { reportType: string; format?: string; parameters?: any }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/reports/generate', payload);
    return data.data;
  },
  status: async (jobId: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/reports/${jobId}`);
    return data.data;
  },
  download: async (jobId: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/reports/${jobId}/download`);
    return data.data;
  },
  verify: async (code: string) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/reports/verify', { code });
    return data.data;
  },
};

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/auth/login', credentials);
    return data.data;
  },
  me: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/auth/me');
    return data.data;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};

export const sessionApi = {
  list: async (): Promise<UserSession[]> => {
    const { data } = await apiClient.get<ApiResponse<UserSession[]>>('/auth/sessions');
    return data.data;
  },
  revoke: async (sessionId: string): Promise<{ message: string; revokedId: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string; revokedId: string }>>(
      `/auth/sessions/revoke/${sessionId}`
    );
    return data.data;
  },
  revokeOthers: async (): Promise<{ message: string; activeRemaining: number }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string; activeRemaining: number }>>(
      '/auth/sessions/revoke-others'
    );
    return data.data;
  },
};

export const charteringApi = {
  list: async (params?: { status?: string; charterType?: string; vesselType?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/chartering', { params });
    return data.data;
  },
  detail: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/chartering/${id}`);
    return data.data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/chartering', payload);
    return data.data;
  },
};

export const procurementApi = {
  list: async (params?: { status?: string; priority?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/procurement', { params });
    return data.data;
  },
  detail: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/procurement/${id}`);
    return data.data;
  },
  plantStock: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/procurement/plant-stock');
    return data.data;
  },
};

export const voyageApi = {
  list: async (params?: { status?: string; vesselId?: string; portId?: string; limit?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/voyages', { params });
    return data.data;
  },
  detail: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/voyages/${id}`);
    return data.data;
  },
};

export const systemApi = {
  health: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/health');
    return data.data;
  },
};

export const cargoApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/cargo', { params });
    return data.data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/cargo', payload);
    return data.data;
  },
  types: async () => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/cargo/types/list');
    return data.data;
  },
  commodities: async (params?: { search?: string; cargoTypeId?: string }) => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/cargo/commodities/list', { params });
    return data.data;
  },
};

export const dataApi = {
  quality: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/data/quality');
    return data.data;
  },
};

export const liveFeedsApi = {
  getStatus: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/live-feeds/status');
    return data.data;
  },
  getMarineWeather: async () => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/live-feeds/marine-weather');
    return data.data;
  },
  getCommodities: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/live-feeds/commodities');
    return data.data;
  },
  getFxRates: async (params?: { freightRateUsd?: number; cargoTonnageMt?: number }) => {
    const { data } = await apiClient.get<ApiResponse<any>>('/live-feeds/fx', { params });
    return data.data;
  },
  getPortLogistics: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/live-feeds/port-logistics');
    return data.data;
  },
  getTradeFlows: async () => {
    const { data } = await apiClient.get<ApiResponse<any>>('/live-feeds/trade-flows');
    return data.data;
  },
  triggerSync: async (source: string = 'all') => {
    const { data } = await apiClient.post<ApiResponse<any>>('/live-feeds/trigger', { source });
    return data.data;
  },
};

export * from './configApi';
export * from './referenceApi';
export * from './settingsApi';


