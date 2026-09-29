import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';
export type CurrencyMode = 'INR' | 'USD';

interface UiState {
  theme: ThemeMode;
  currency: CurrencyMode;
  exchangeRate: number; // 1 USD = 95.00 INR
  sidebarCollapsed: boolean;
  isSidebarCollapsed: boolean;
  isSearchOpen: boolean;
  isCopilotOpen: boolean;
  activeTradeLane: string;
  dataFreshnessTimestamp: string;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCurrency: (currency: CurrencyMode) => void;
  toggleCurrency: () => void;
  setExchangeRate: (rate: number) => void;
  fetchExchangeRate: () => Promise<void>;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setCopilotOpen: (open: boolean) => void;
  setActiveTradeLane: (lane: string) => void;
  isDemurrageOpen: boolean;
  setDemurrageOpen: (open: boolean) => void;
  isArbitrageOpen: boolean;
  setArbitrageOpen: (open: boolean) => void;
  isMonteCarloOpen: boolean;
  setMonteCarloOpen: (open: boolean) => void;
  isScratchpadOpen: boolean;
  setScratchpadOpen: (open: boolean) => void;
}

const getInitialCurrency = (): CurrencyMode => {
  if (typeof window === 'undefined') return 'INR';
  const saved = localStorage.getItem('marinex_currency') as CurrencyMode;
  if (saved === 'INR' || saved === 'USD') return saved;
  return 'INR'; // User requested INR (Rs) as default
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('marinex_theme') as ThemeMode;
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light'; // Default to clean corporate light theme
};

const applyThemeToDOM = (theme: ThemeMode, withTransition = false) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (withTransition) {
    root.classList.add('theme-transition');
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 700);
  }

  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
  localStorage.setItem('marinex_theme', theme);
};

const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useUiStore = create<UiState>((set) => ({
  theme: initialTheme,
  currency: getInitialCurrency(),
  exchangeRate: 95.00, // 1 USD = 95.00 INR standard
  sidebarCollapsed: false,
  isSidebarCollapsed: false,
  isSearchOpen: false,
  isCopilotOpen: false,
  activeTradeLane: 'ALL',
  dataFreshnessTimestamp:
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',

  setTheme: (theme) => {
    applyThemeToDOM(theme, true);
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      applyThemeToDOM(nextTheme, true);
      return { theme: nextTheme };
    }),

  setCurrency: (currency) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('marinex_currency', currency);
    }
    set({ currency });
  },

  toggleCurrency: () =>
    set((state) => {
      const next = state.currency === 'INR' ? 'USD' : 'INR';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('marinex_currency', next);
      }
      return { currency: next };
    }),

  setExchangeRate: (exchangeRate) => set({ exchangeRate }),
  fetchExchangeRate: async () => {
    try {
      const res = await fetch('/api/v1/reference/exchange-rates');
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.rate) {
          set({ exchangeRate: Number(json.data.rate) });
        }
      }
    } catch {
      // Retain fallback benchmark
    }
  },

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v, isSidebarCollapsed: v }),
  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
      isSidebarCollapsed: !state.isSidebarCollapsed,
    })),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setCopilotOpen: (open) => set({ isCopilotOpen: open }),
  setActiveTradeLane: (lane) => set({ activeTradeLane: lane }),
  isDemurrageOpen: false,
  setDemurrageOpen: (open) => set({ isDemurrageOpen: open }),
  isArbitrageOpen: false,
  setArbitrageOpen: (open) => set({ isArbitrageOpen: open }),
  isMonteCarloOpen: false,
  setMonteCarloOpen: (open) => set({ isMonteCarloOpen: open }),
  isScratchpadOpen: false,
  setScratchpadOpen: (open) => set({ isScratchpadOpen: open }),
}));

if (typeof window !== 'undefined') {
  useUiStore.getState().fetchExchangeRate();
}
