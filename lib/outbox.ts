// Offline outbox for symptom notes: a save that fails for want of a connection is kept on the
// phone (AsyncStorage on native, localStorage on web; same API) and sent when the app is back
// online. Each item carries a client id and flushes run one at a time, so the phone sends a note once; there is no server-side
// idempotency key yet, so a crash between a successful send and removing it from the queue could send it again.
// Cleared on sign-out. Only symptom notes are queued; nothing else is stored here.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SymptomData } from '../types/records';
import { ApiError } from './api';

const KEY = 'atossa.outbox.v1';

export interface OutboxItem { clientId: string; userId: string; data: SymptomData; queuedAt: string }

export async function readOutbox(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function write(items: OutboxItem[]) {
  try {
    if (items.length) await AsyncStorage.setItem(KEY, JSON.stringify(items));
    else await AsyncStorage.removeItem(KEY);
  } catch { /* storage unavailable: the note stays in memory for this session only */ }
}

export async function enqueue(item: OutboxItem) {
  const items = await readOutbox();
  if (!items.some((i) => i.clientId === item.clientId)) await write([...items, item]);
}

export async function dequeue(clientId: string) {
  await write((await readOutbox()).filter((i) => i.clientId !== clientId));
}

export const clearOutbox = () => write([]);

/** True for "no connection / server down" failures, false for ones a retry cannot fix (bad data, signed out). */
export function isOfflineError(e: unknown): boolean {
  if (e instanceof ApiError) return e.status >= 500;
  // fetch rejects with a TypeError when there is no network ("Network request failed" on iOS); the preview backend throws Error('offline').
  if (!(e instanceof Error)) return false;
  // Only a failed network request: RN "Network request failed", Chrome "Failed to fetch", Safari "Load failed", or the preview's own throw.
  return e.message === 'offline' || (e instanceof TypeError && /network request failed|failed to fetch|load failed|network/i.test(e.message));
}

export const newClientId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const PENDING_PREFIX = 'pending-';
