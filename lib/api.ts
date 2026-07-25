import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

const ACCESS_KEY = 'atossa_access_token';
const REFRESH_KEY = 'atossa_refresh_token';

export async function getStoredAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

let _onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(cb: () => void) {
  _onSessionExpired = cb;
}

async function attemptRefresh(): Promise<string | null> {
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const res = await fetch(`${Config.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json();
    await saveTokens(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  _retry = true,
): Promise<T> {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${Config.apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && _retry) {
    const newToken = await attemptRefresh();
    if (newToken) return request<T>(method, path, body, false);
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
  patch:  <T>(path: string, body: unknown)  => request<T>('PATCH', path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
};
