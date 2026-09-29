export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  vessels: {
    all: ['vessels'] as const,
    list: (filters?: any) => ['vessels', 'list', filters] as const,
    detail: (id: string) => ['vessels', 'detail', id] as const,
  },
  ports: {
    all: ['ports'] as const,
    list: (filters?: any) => ['ports', 'list', filters] as const,
    detail: (id: string) => ['ports', 'detail', id] as const,
  },
  freight: {
    rates: (filters?: any) => ['freight', 'rates', filters] as const,
    codes: ['freight', 'codes'] as const,
    history: (code: string) => ['freight', 'history', code] as const,
  },
  forecasts: {
    latest: (code: string) => ['forecasts', 'latest', code] as const,
    run: (id: string) => ['forecasts', 'run', id] as const,
    models: ['forecasts', 'models'] as const,
  },
  decision: {
    analyze: ['decision', 'analyze'] as const,
    recommendations: (filters?: any) => ['decision', 'recommendations', filters] as const,
  },
  contracts: {
    list: (filters?: any) => ['contracts', 'list', filters] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
  },
  risks: {
    dashboard: ['risks', 'dashboard'] as const,
    factors: (filters?: any) => ['risks', 'factors', filters] as const,
  },
  scenarios: {
    list: ['scenarios', 'list'] as const,
    detail: (id: string) => ['scenarios', 'detail', id] as const,
  },
  procurement: {
    requirements: (filters?: any) => ['procurement', 'requirements', filters] as const,
    plantStock: ['procurement', 'plantStock'] as const,
  },
  config: {
    ui: ['config', 'ui'] as const,
  },
  reference: {
    exchangeRates: ['reference', 'exchangeRates'] as const,
    contractStatuses: ['reference', 'contractStatuses'] as const,
  },
  data: {
    quality: ['data', 'quality'] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
  },
  jobs: {
    list: ['jobs', 'list'] as const,
  },
  audit: {
    logs: (filters?: any) => ['audit', 'logs', filters] as const,
  },
  reports: {
    list: ['reports', 'list'] as const,
  },
  system: {
    health: ['system', 'health'] as const,
  },
};
