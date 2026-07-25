import { create } from 'zustand';
import type { Profile } from '../types/database';
import { api, clearTokens, saveTokens } from '../lib/api';

export interface AuthSession {
  access_token: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: AuthSession | null) => void;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => {
    set({ session, isLoading: false, isInitialized: true });
  },

  setUser: (user) => {
    set({ user });
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    try {
      const profile = await api.get<Profile>('/me');
      set({ profile });
    } catch {}
  },

  login: async (email, password) => {
    const tokens = await api.post<{ access_token: string; refresh_token: string }>(
      '/auth/login',
      { email, password },
    );
    await saveTokens(tokens.access_token, tokens.refresh_token);
    const [user, profile] = await Promise.all([
      api.get<AuthUser>('/auth/me'),
      api.get<Profile>('/me'),
    ]);
    set({ session: { access_token: tokens.access_token }, user, profile, isInitialized: true, isLoading: false });
  },

  register: async (email, password, display_name) => {
    const tokens = await api.post<{ access_token: string; refresh_token: string }>(
      '/auth/register',
      { email, password, display_name },
    );
    await saveTokens(tokens.access_token, tokens.refresh_token);
    const [user, profile] = await Promise.all([
      api.get<AuthUser>('/auth/me'),
      api.get<Profile>('/me'),
    ]);
    set({ session: { access_token: tokens.access_token }, user, profile, isInitialized: true, isLoading: false });
  },

  signOut: async () => {
    await clearTokens();
    set({ session: null, user: null, profile: null, isLoading: false, isInitialized: true });
  },
}));
