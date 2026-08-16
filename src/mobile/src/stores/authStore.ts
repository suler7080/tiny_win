import { create } from 'zustand';
import { appStorage } from '../utils/storage';
import { UserProfile } from '../types';
import * as authApi from '../api/auth';
import { extractErrorMessage } from '../api/client';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitializing: boolean;
  isSubmitting: boolean;
  isLoading: boolean; // Alias for compatibility
  error: string | null;

  initAuth: () => Promise<void>;
  login: (payload: authApi.LoginPayload) => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitializing: true,
  isSubmitting: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    try {
      set({ isInitializing: true, isLoading: true, error: null });
      const accessToken = await appStorage.getItem('access_token');
      const refreshToken = await appStorage.getItem('refresh_token');
      const userStr = await appStorage.getItem('user_profile');

      if (accessToken && userStr) {
        set({
          accessToken,
          refreshToken,
          user: JSON.parse(userStr),
          isInitializing: false,
          isLoading: false,
        });
      } else {
        set({ isInitializing: false, isLoading: false });
      }
    } catch (e) {
      console.warn('initAuth error:', e);
      set({ isInitializing: false, isLoading: false });
    }
  },

  login: async (payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await authApi.login(payload);
      await appStorage.setItem('access_token', data.access_token);
      await appStorage.setItem('refresh_token', data.refresh_token);
      await appStorage.setItem('user_profile', JSON.stringify(data.user));

      set({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        isSubmitting: false,
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      set({ error: msg, isSubmitting: false });
      throw new Error(msg);
    }
  },

  register: async (payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const data = await authApi.register(payload);
      await appStorage.setItem('access_token', data.access_token);
      await appStorage.setItem('refresh_token', data.refresh_token);
      await appStorage.setItem('user_profile', JSON.stringify(data.user));

      set({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        isSubmitting: false,
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      set({ error: msg, isSubmitting: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      await appStorage.multiRemove(['access_token', 'refresh_token', 'user_profile']);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
