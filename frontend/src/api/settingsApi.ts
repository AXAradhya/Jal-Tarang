import apiClient from './client';
import type { ApiResponse } from '../types';
import type { EnterpriseSettings } from '../store/settingsStore';

export interface EndpointTestResult {
  type: string;
  url: string;
  status: 'REACHABLE' | 'DEGRADED' | 'UNREACHABLE';
  httpStatus: number | null;
  latencyMs: number;
  message: string;
}

export const settingsApi = {
  get: async (): Promise<EnterpriseSettings> => {
    const { data } = await apiClient.get<ApiResponse<EnterpriseSettings>>('/settings');
    return data.data;
  },

  update: async (updates: Partial<EnterpriseSettings>): Promise<EnterpriseSettings> => {
    const { data } = await apiClient.put<ApiResponse<EnterpriseSettings>>('/settings', updates);
    return data.data;
  },

  reset: async (): Promise<EnterpriseSettings> => {
    const { data } = await apiClient.post<ApiResponse<EnterpriseSettings>>('/settings/reset');
    return data.data;
  },

  testEndpoint: async (payload: { type?: string; url: string; apiKey?: string }): Promise<EndpointTestResult> => {
    const { data } = await apiClient.post<ApiResponse<EndpointTestResult>>('/settings/test-endpoint', payload);
    return data.data;
  },
};
