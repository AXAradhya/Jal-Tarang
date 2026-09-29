import apiClient from './client';
import type { ApiResponse } from '../types';

export interface ExchangeRateResponse {
  base: string;
  target: string;
  rate: number;
  usdToInr: number;
  timestamp: string;
  source: string;
}

export interface ContractStatusOption {
  code: string;
  label: string;
}

export const referenceApi = {
  getExchangeRates: async (): Promise<ExchangeRateResponse> => {
    const { data } = await apiClient.get<ApiResponse<ExchangeRateResponse>>('/reference/exchange-rates');
    return data.data;
  },

  getContractStatuses: async (): Promise<ContractStatusOption[]> => {
    const { data } = await apiClient.get<ApiResponse<ContractStatusOption[]>>('/reference/contract-statuses');
    return data.data;
  },
};
