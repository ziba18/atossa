// Offline consulting room (blueprint 3.7 "Opens with no signal"): the last records list that loaded is kept on this
// phone (AsyncStorage on native, localStorage on web), one copy for the signed-in account only, so For my doctor
// still opens in a clinic with no signal. Cleared on sign-out and account delete. Nothing else reads it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DataMap, Rec, RecordKind } from '../types/records';

const KEY = 'atossa.records-snapshot.v1';

export type SnapshotBuckets = { [K in RecordKind]: Rec<DataMap[K]>[] };
export interface RecordsSnapshot { userId: string; savedAt: string; records: SnapshotBuckets }

export async function saveSnapshot(userId: string, records: SnapshotBuckets, now = new Date()): Promise<void> {
  // Notes still in the outbox are not part of the copy: they are re-read from the outbox itself.
  const kept = { ...records, symptom: records.symptom.filter((r) => !r.pending) };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ userId, savedAt: now.toISOString(), records: kept }));
  } catch {
    // Storage full or blocked: the app still works online; there is just no offline copy.
  }
}

/** The saved copy for this account, or null (none, another account's, or unreadable). */
export async function readSnapshot(userId: string): Promise<RecordsSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as RecordsSnapshot;
    return s && s.userId === userId && s.records && typeof s.savedAt === 'string' ? s : null;
  } catch {
    return null;
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // nothing stored
  }
}
