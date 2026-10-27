import { create } from 'zustand';
import type { Profile } from '../types/database';
import { api, clearTokens, saveTokens } from '../lib/api';
import { clearOutbox } from '../lib/outbox';
import { clearLocalChats } from './chatStore';
import { deleteLastSharedPdf } from '../components/atossa/doctor/share';

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
  loginWithApple: (idToken: string, displayName?: string | null) => Promise<void>;
  loginWithGoogle: (idToken: string, displayName?: string | null, accessToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account and all its data on the server, then signs out. */
  deleteAccount: () => Promise<void>;
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

  loginWithApple: async (idToken, displayName) => {
    const tokens = await api.post<{ access_token: string; refresh_token: string }>(
      '/auth/apple',
      { id_token: idToken, display_name: displayName ?? undefined },
    );
    await saveTokens(tokens.access_token, tokens.refresh_token);
    const [user, profile] = await Promise.all([
      api.get<AuthUser>('/auth/me'),
      api.get<Profile>('/me'),
    ]);
    set({ session: { access_token: tokens.access_token }, user, profile, isInitialized: true, isLoading: false });
  },

  loginWithGoogle: async (idToken, displayName, accessToken) => {
    const tokens = await api.post<{ access_token: string; refresh_token: string }>(
      '/auth/google',
      { id_token: idToken, display_name: displayName ?? undefined, access_token: accessToken },
    );
    await saveTokens(tokens.access_token, tokens.refresh_token);
    const [user, profile] = await Promise.all([
      api.get<AuthUser>('/auth/me'),
      api.get<Profile>('/me'),
    ]);
    set({ session: { access_token: tokens.access_token }, user, profile, isInitialized: true, isLoading: false });
  },

  signOut: async () => {
    await clearOutbox(); // notes still waiting to send belong to this account
    await deleteLastSharedPdf();
    const id = useAuthStore.getState().user?.id;
    if (id) await clearLocalChats(id);
    await clearTokens();
    set({ session: null, user: null, profile: null, isLoading: false, isInitialized: true });
  },

  deleteAccount: async () => {
    await api.delete('/me');
    await clearOutbox();
    const id = useAuthStore.getState().user?.id;
    if (id) await clearLocalChats(id);
    await deleteLastSharedPdf();
    await clearTokens();
    set({ session: null, user: null, profile: null, isLoading: false, isInitialized: true });
  },
}));
