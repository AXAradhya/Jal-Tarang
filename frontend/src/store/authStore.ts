import { create } from 'zustand';
import { SystemRole, User } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: SystemRole;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  switchRole: (role: SystemRole) => void;
  hasRole: (roles: SystemRole[]) => boolean;
  initializeAuth: () => Promise<void>;
}

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('marinex_token');
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('marinex_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = getStoredToken();
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),
  isLoading: Boolean(initialToken && !initialUser),
  activeRole: initialUser?.roles?.[0] || 'CHARTERING_MANAGER',

  initializeAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const meData = await authApi.me();
      if (meData && meData.id) {
        const validatedUser: User = {
          id: meData.id,
          email: meData.email,
          firstName: meData.first_name || meData.firstName || 'Officer',
          lastName: meData.last_name || meData.lastName || 'SAIL',
          organizationId: meData.organization_id || meData.organizationId || 'org-sail-corp',
          organizationName: meData.organization_name || meData.organizationName || 'Steel Authority of India Limited (SAIL)',
          roles: meData.roles && meData.roles.length > 0 ? meData.roles : ['CHARTERING_MANAGER'],
          permissions: meData.permissions || ['*'],
          isActive: true,
          lastLoginAt: new Date().toISOString(),
        };
        localStorage.setItem('marinex_user', JSON.stringify(validatedUser));
        set({
          user: validatedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
          activeRole: validatedUser.roles[0] || 'CHARTERING_MANAGER',
        });
      } else {
        throw new Error('Invalid user payload');
      }
    } catch {
      // If server is unreachable or in showcase mode, retain existing stored user & token
      const existingUser = getStoredUser();
      const existingToken = getStoredToken();
      if (existingUser && existingToken) {
        set({
          user: existingUser,
          token: existingToken,
          isAuthenticated: true,
          isLoading: false,
          activeRole: existingUser.roles?.[0] || 'CHARTERING_MANAGER',
        });
        return;
      }

      // Token is expired or invalid
      try {
        localStorage.removeItem('marinex_token');
        localStorage.removeItem('marinex_user');
        localStorage.removeItem('marinex_refresh_token');
      } catch {
        // ignore
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: (user, token, refreshToken) => {
    try {
      localStorage.setItem('marinex_token', token);
      localStorage.setItem('marinex_user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('marinex_refresh_token', refreshToken);
      }
    } catch {
      // ignore
    }
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      activeRole: user.roles[0] || 'CHARTERING_MANAGER',
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API failure during logout
    }
    try {
      localStorage.removeItem('marinex_token');
      localStorage.removeItem('marinex_user');
      localStorage.removeItem('marinex_refresh_token');
    } catch {
      // ignore
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  switchRole: (role: SystemRole) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      roles: [role, ...currentUser.roles.filter((r) => r !== role)],
    };
    try {
      localStorage.setItem('marinex_user', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    set({
      activeRole: role,
      user: updatedUser,
    });
  },

  hasRole: (allowedRoles: SystemRole[]) => {
    const { activeRole, user } = get();
    if (!user) return false;
    if (activeRole === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(activeRole);
  },
}));

