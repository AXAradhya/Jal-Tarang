import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookmarksState {
  pinnedRoutes: string[];
  recentHistory: { path: string; label: string; timestamp: number }[];
  togglePin: (path: string) => void;
  isPinned: (path: string) => boolean;
  recordVisit: (path: string, label: string) => void;
  clearHistory: () => void;
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      pinnedRoutes: ['/dashboard', '/control-tower', '/decision', '/chartering'],
      recentHistory: [],

      togglePin: (path) => {
        set((state) => {
          const exists = state.pinnedRoutes.includes(path);
          return {
            pinnedRoutes: exists
              ? state.pinnedRoutes.filter((p) => p !== path)
              : [...state.pinnedRoutes, path],
          };
        });
      },

      isPinned: (path) => {
        return get().pinnedRoutes.includes(path);
      },

      recordVisit: (path, label) => {
        // Exclude auth and subpaths that don't make sense
        if (path === '/login' || !path) return;
        set((state) => {
          const filtered = state.recentHistory.filter((item) => item.path !== path);
          const updated = [{ path, label, timestamp: Date.now() }, ...filtered].slice(0, 10);
          return { recentHistory: updated };
        });
      },

      clearHistory: () => set({ recentHistory: [] }),
    }),
    {
      name: 'sail_marinex_bookmarks_v1',
    }
  )
);
