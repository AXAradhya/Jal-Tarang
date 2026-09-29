import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { useConfigStore } from './store/configStore';
import { useUiStore } from './store/uiStore';

// Initialize global live configuration & exchange rates from official feeds
useConfigStore.getState().fetchConfig().catch(() => {});
useUiStore.getState().fetchExchangeRate().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: (failureCount, error: any) => {
        // Do not retry client errors (401, 403, 404)
        if (error?.response?.status && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000), // Exponential backoff
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
