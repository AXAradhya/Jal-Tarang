import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSession } from '../types';
import { sessionApi } from '../api';
import { useToastStore } from './toastStore';

interface SessionState {
  sessions: UserSession[];
  isLoading: boolean;
  timeoutMinutes: number; // Inactivity timeout in minutes (15, 30, 60, 120, 480)
  lastActivityTime: number;

  fetchSessions: () => Promise<void>;
  revokeSession: (id: string) => Promise<boolean>;
  revokeOtherSessions: () => Promise<boolean>;
  setTimeoutMinutes: (minutes: number) => void;
  recordActivity: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      isLoading: false,
      timeoutMinutes: 30, // Default 30 min timeout for enterprise maritime terminal
      lastActivityTime: Date.now(),

      recordActivity: () => {
        set({ lastActivityTime: Date.now() });
      },

      setTimeoutMinutes: (minutes: number) => {
        set({ timeoutMinutes: minutes });
        useToastStore.getState().addToast({
          type: 'success',
          title: 'Session Timeout Updated',
          message: `Inactivity auto-logout duration updated to ${minutes} minutes.`,
        });
      },

      fetchSessions: async () => {
        set({ isLoading: true });
        try {
          const sessions = await sessionApi.list();
          set({ sessions: Array.isArray(sessions) ? sessions : [], isLoading: false });
        } catch (err: any) {
          console.warn('[sessionStore] Failed to fetch active sessions', err);
          set({ isLoading: false });
        }
      },

      revokeSession: async (id: string) => {
        const target = get().sessions.find((s) => s.id === id);
        if (target?.isCurrent) {
          useToastStore.getState().addToast({
            type: 'warning',
            title: 'Current Session Active',
            message: 'You cannot revoke your active working session. Use Sign Out instead.',
          });
          return false;
        }

        try {
          await sessionApi.revoke(id);
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
          }));
          useToastStore.getState().addToast({
            type: 'success',
            title: 'Session Terminated',
            message: `Remote session for ${target?.device || 'device'} successfully disconnected.`,
          });
          return true;
        } catch (err: any) {
          useToastStore.getState().addToast({
            type: 'error',
            title: 'Revocation Failed',
            message: err?.response?.data?.error?.message || err.message || 'Could not terminate remote session',
          });
          return false;
        }
      },

      revokeOtherSessions: async () => {
        try {
          const res = await sessionApi.revokeOthers();
          set((state) => ({
            sessions: state.sessions.filter((s) => s.isCurrent),
          }));
          useToastStore.getState().addToast({
            type: 'success',
            title: 'Remote Sessions Terminated',
            message: res?.message || 'All other active sessions have been safely logged out.',
          });
          return true;
        } catch (err: any) {
          useToastStore.getState().addToast({
            type: 'error',
            title: 'Action Failed',
            message: err?.response?.data?.error?.message || err.message || 'Failed to terminate other sessions',
          });
          return false;
        }
      },
    }),
    {
      name: 'sail_marinex_session_settings_v1',
      partialize: (state) => ({
        timeoutMinutes: state.timeoutMinutes,
      }),
    }
  )
);
