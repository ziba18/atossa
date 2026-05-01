import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

// SecureStore has a 2048-byte per-key limit. Supabase session tokens exceed this,
// so we chunk large values across multiple keys.
const CHUNK_SIZE = 1900;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const [direct, countStr] = await Promise.all([
      SecureStore.getItemAsync(key),
      SecureStore.getItemAsync(`${key}__chunks`),
    ]);
    if (direct !== null) return direct;
    if (!countStr) return null;
    const count = parseInt(countStr, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}__chunk_${i}`))
    );
    if (chunks.some((c) => c === null)) return null;
    return chunks.join('');
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await cleanChunks(key);
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await SecureStore.deleteItemAsync(key);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}__chunk_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}__chunks`, String(count));
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
    await cleanChunks(key);
  },
};

async function cleanChunks(key: string) {
  const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
  if (!countStr) return;
  const count = parseInt(countStr, 10);
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
  }
  await SecureStore.deleteItemAsync(`${key}__chunks`);
}

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
