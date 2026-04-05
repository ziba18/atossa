import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

// SecureStore adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Typed helper: fetch single row or null
export async function fetchOne<T>(
  table: string,
  match: Record<string, unknown>
): Promise<T | null> {
  const query = Object.entries(match).reduce(
    (q, [col, val]) => q.eq(col, val),
    supabase.from(table).select('*')
  );
  const { data, error } = await (query as any).maybeSingle();
  if (error) throw error;
  return data as T | null;
}

// Typed helper: fetch many rows
export async function fetchMany<T>(
  table: string,
  match?: Record<string, unknown>,
  options?: { orderBy?: string; ascending?: boolean; limit?: number }
): Promise<T[]> {
  let query = supabase.from(table).select('*');
  if (match) {
    for (const [col, val] of Object.entries(match)) {
      query = query.eq(col, val) as any;
    }
  }
  if (options?.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false }) as any;
  }
  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}
