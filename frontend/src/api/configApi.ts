import apiClient from './client';
import type { ApiResponse } from '../types';

export interface UiConfigResponse {
  horizons: Array<{ value: string; label: string }>;
  lineageStages: Array<{ id: string; label: string; items: string[]; color: string }>;
  contractStatuses: string[];
  roleOptions: Array<{ role: string; label: string; icon: string }>;
  roleQuestions: Record<string, string[]>;
  pageExplorationQuestions: string[];
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
  serverTime: string;
}

export const configApi = {
  getUiConfig: async (): Promise<UiConfigResponse> => {
    const { data } = await apiClient.get<ApiResponse<UiConfigResponse>>('/config/ui');
    return data.data;
  },
};
