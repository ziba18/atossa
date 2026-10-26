import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Config } from '../constants/config';

// expo-secure-store has no web implementation (it throws there). The web build only exists
// for the design preview, so fall back to localStorage on web instead of crashing.
const tokenStore = Platform.OS === 'web'
  ? {
      getItemAsync: async (k: string) => { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
      setItemAsync: async (k: string, v: string) => { try { globalThis.localStorage?.setItem(k, v); } catch {} },
      deleteItemAsync: async (k: string) => { try { globalThis.localStorage?.removeItem(k); } catch {} },
    }
  : SecureStore;

const ACCESS_KEY = 'atossa_access_token';
const REFRESH_KEY = 'atossa_refresh_token';

export async function getStoredAccessToken(): Promise<string | null> {
  return tokenStore.getItemAsync(ACCESS_KEY);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    tokenStore.setItemAsync(ACCESS_KEY, access),
    tokenStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    tokenStore.deleteItemAsync(ACCESS_KEY),
    tokenStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

let _onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(cb: () => void) {
  _onSessionExpired = cb;
}

type RefreshResult = { token: string } | { token: null; network: boolean };

async function refreshOnce(): Promise<RefreshResult> {
  const refresh = await tokenStore.getItemAsync(REFRESH_KEY);
  if (!refresh) return { token: null, network: false };
  try {
    const res = await fetch(`${Config.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      await clearTokens();
      return { token: null, network: false };
    }
    const data = await res.json();
    await saveTokens(data.access_token, data.refresh_token);
    return { token: data.access_token as string };
  } catch {
    // Offline or the server is waking up: the refresh token is still good, so keep it.
    return { token: null, network: true };
  }
}

// One refresh at a time: parallel 401s share it, which matters once refresh tokens rotate.
let refreshing: Promise<RefreshResult> | null = null;

function attemptRefresh(): Promise<RefreshResult> {
  if (!refreshing) refreshing = refreshOnce().finally(() => { refreshing = null; });
  return refreshing;
}

// Fire-and-forget: the free-tier backend spins down when idle, so wake it (and its DB
// connection) while the user is still typing credentials instead of on the login tap.
export function warmBackend(): void {
  fetch(`${Config.apiUrl}/warmup`).catch(() => {});
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const SIGN_IN_PATHS = new Set(['/auth/login', '/auth/apple', '/auth/google']);

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  _retry = true,
): Promise<T> {
  const token = await tokenStore.getItemAsync(ACCESS_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${Config.apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // A 401 from a sign-in call means the credentials were rejected, not that a
  // session expired — fall through so the server's reason reaches the user.
  if (res.status === 401 && _retry && !SIGN_IN_PATHS.has(path)) {
    const refreshed = await attemptRefresh();
    if (refreshed.token) return request<T>(method, path, body, false);
    if ('network' in refreshed && refreshed.network) throw new ApiError(0, 'No connection. Please try again.');
    _onSessionExpired?.();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const json = await res.json();
      detail = String(json.detail ?? detail);
    } catch {}
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                 => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body: unknown)  => request<T>('PUT', path, body),
  patch:  <T>(path: string, body: unknown)  => request<T>('PATCH', path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
};
