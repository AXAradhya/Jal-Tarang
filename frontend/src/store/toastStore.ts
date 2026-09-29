import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

// Quick helper
export const showToast = (
  title: string,
  message?: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'info',
  duration?: number
) => {
  let defaultDuration = 5000;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('sail_marinex_settings_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.popupDuration) defaultDuration = parsed.popupDuration * 1000;
      }
    } catch {}
  }
  return useToastStore.getState().addToast({ title, message, type, duration: duration ?? defaultDuration });
};
