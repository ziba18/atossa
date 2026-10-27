import { create } from 'zustand';
import { api } from '../lib/api';
import { PENDING_PREFIX, clearOutbox, dequeue, enqueue, isOfflineError, newClientId, readOutbox } from '../lib/outbox';
import { IS_PREVIEW } from '../lib/preview/flag';
import { sampleBuckets } from '../lib/preview/seed';
import type { DataMap, Rec, RecordKind } from '../types/records';

interface ServerRecord {
  id: string;
  kind: RecordKind;
  data: DataMap[RecordKind];
  created_at: string;
}

type Buckets = { [K in RecordKind]: Rec<DataMap[K]>[] };

const emptyBuckets = (): Buckets => ({
  symptom: [], appointment: [], medicine: [], history: [], period_day: [], doctor_note: [],
});

interface RecordsState {
  records: Buckets;
  loadedFor: string | null; // user id the data belongs to
  loading: boolean;
  error: string;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  /** Send notes saved while offline; safe to call any time (one run at a time, each note once). */
  flushOutbox: () => Promise<void>;
  create: <K extends RecordKind>(kind: K, data: DataMap[K]) => Promise<Rec<DataMap[K]>>;
  update: <K extends RecordKind>(kind: K, id: string, data: DataMap[K]) => Promise<void>;
  remove: (kind: RecordKind, id: string) => Promise<void>;
  /** Insert-or-update one period day per date, then apply all changes to state at once. */
  savePeriodDays: (days: DataMap['period_day'][]) => Promise<void>;
  deletePeriodDay: (date: string) => Promise<void>;
  saveDoctorNote: (text: string) => Promise<void>;
  /** Design-preview only (no-op otherwise): empty every bucket so empty states can be reviewed. */
  clearSampleData: () => void;
  /** Design-preview only (no-op otherwise): put Sam's seed records back. */
  restoreSampleData: () => void;
}

const toRec = <K extends RecordKind>(row: ServerRecord): Rec<DataMap[K]> => ({
  id: row.id,
  data: row.data as DataMap[K],
  createdAt: row.created_at,
});

/**
 * Where records are persisted. Normal builds talk to the FastAPI `/records` endpoints;
 * design-preview mode (EXPO_PUBLIC_DESIGN_PREVIEW=1) keeps everything in memory, no network.
 */
interface Backend {
  list: () => Promise<ServerRecord[] | Buckets>;
  create: (kind: RecordKind, data: unknown) => Promise<ServerRecord>;
  update: (id: string, data: unknown) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const serverBackend: Backend = {
  list: async () => (await api.get<{ records: ServerRecord[] }>('/records')).records,
  create: (kind, data) => api.post<ServerRecord>('/records', { kind, data }),
  update: async (id, data) => { await api.put<ServerRecord>(`/records/${id}`, { data }); },
  remove: async (id) => { await api.delete<void>(`/records/${id}`); },
};

let localSeq = 0;
/** Flag in memory, or in localStorage so it survives a page reload (outbox check). */
const previewOffline = () => {
  if ((globalThis as { __PREVIEW_OFFLINE__?: boolean }).__PREVIEW_OFFLINE__) return true;
  try { return globalThis.localStorage?.getItem('atossa.preview.offline') === '1'; } catch { return false; }
};
const previewBackend: Backend = {
  list: async () => sampleBuckets(),
  create: async (kind, data) => {
    // Preview only: reviewers/screenshots set globalThis.__PREVIEW_OFFLINE__ = true to see the failed-save state.
    if (previewOffline()) throw new Error('offline');
    return previewCreate(kind, data);
  },
  update: async () => {},
  remove: async () => {},
};
const previewCreate = (kind: RecordKind, data: unknown): ServerRecord => ({
  id: `local-${Date.now()}-${++localSeq}`,
  kind,
  data: data as DataMap[RecordKind],
  created_at: new Date().toISOString(),
});

const backend = IS_PREVIEW ? previewBackend : serverBackend;

let flushing = false;

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: emptyBuckets(),
  loadedFor: null,
  loading: false,
  error: '',

  load: async (userId) => {
    set({ loading: true, error: '' });
    try {
      const listed = await backend.list();
      let buckets: Buckets;
      if (Array.isArray(listed)) {
        buckets = emptyBuckets();
        for (const row of listed) (buckets[row.kind] as Rec<any>[]).push(toRec(row));
      } else {
        buckets = listed;
      }
      // Notes still waiting in the outbox stay on screen, marked pending, until they are sent.
      const waiting = (await readOutbox()).filter((i) => i.userId === userId);
      for (const i of waiting) {
        buckets.symptom.push({ id: PENDING_PREFIX + i.clientId, data: i.data, createdAt: i.queuedAt, pending: true });
      }
      set({ records: buckets, loadedFor: userId, loading: false });
      if (waiting.length) void get().flushOutbox();
    } catch {
      set({ loading: false, error: "We couldn't load your information. Check your connection and try again." });
    }
  },

  reset: () => {
    // Sign-out / account switch: queued notes belong to the old account. Not on a cold start (nothing loaded yet),
    // where the tabs layout also calls reset() before the session has restored.
    if (get().loadedFor) void clearOutbox();
    set({ records: emptyBuckets(), loadedFor: null, loading: false, error: '' });
  },

  flushOutbox: async () => {
    if (flushing) return;
    flushing = true;
    try {
      const userId = get().loadedFor;
      for (const item of await readOutbox()) {
        if (item.userId !== userId) { await dequeue(item.clientId); continue; }
        try {
          const row = await backend.create('symptom', item.data);
          await dequeue(item.clientId);
          const rec = toRec<'symptom'>(row);
          set((s) => ({ records: { ...s.records, symptom: s.records.symptom.map((r) => (r.id === PENDING_PREFIX + item.clientId ? rec : r)) } }));
        } catch (e) {
          if (isOfflineError(e)) break; // still offline: keep the rest, try again later
          await dequeue(item.clientId);
          set((s) => ({ records: { ...s.records, symptom: s.records.symptom.filter((r) => r.id !== PENDING_PREFIX + item.clientId) } }));
        }
      }
    } finally {
      flushing = false;
    }
  },

  create: async (kind, data) => {
    let row: ServerRecord;
    try {
      row = await backend.create(kind, data);
    } catch (e) {
      const userId = get().loadedFor;
      if (kind !== 'symptom' || !userId || !isOfflineError(e)) throw e;
      // No connection: keep the note on this phone and send it later (never lose a note).
      const clientId = newClientId();
      const queuedAt = new Date().toISOString();
      await enqueue({ clientId, userId, data: data as DataMap['symptom'], queuedAt });
      const rec: Rec<DataMap['symptom']> = { id: PENDING_PREFIX + clientId, data: data as DataMap['symptom'], createdAt: queuedAt, pending: true };
      set((s) => ({ records: { ...s.records, symptom: [...s.records.symptom, rec] } }));
      return rec as Rec<DataMap[typeof kind]>;
    }
    const rec = toRec<typeof kind>(row);
    set((s) => ({ records: { ...s.records, [kind]: [...(s.records[kind] as Rec<any>[]), rec] } as Buckets }));
    return rec;
  },

  update: async (kind, id, data) => {
    if (id.startsWith(PENDING_PREFIX)) {
      // Not sent yet: change the queued copy, same client id.
      const clientId = id.slice(PENDING_PREFIX.length);
      const queued = (await readOutbox()).find((i) => i.clientId === clientId);
      if (!queued) throw new Error('This note was just sent. Open it again to edit it.');
      await dequeue(clientId);
      await enqueue({ ...queued, data: data as DataMap['symptom'] });
    } else {
      await backend.update(id, data);
    }
    set((s) => ({
      records: {
        ...s.records,
        [kind]: (s.records[kind] as Rec<any>[]).map((r) => (r.id === id ? { ...r, data } : r)),
      } as Buckets,
    }));
  },

  remove: async (kind, id) => {
    if (id.startsWith(PENDING_PREFIX)) await dequeue(id.slice(PENDING_PREFIX.length));
    else await backend.remove(id);
    set((s) => ({
      records: { ...s.records, [kind]: (s.records[kind] as Rec<any>[]).filter((r) => r.id !== id) } as Buckets,
    }));
  },

  savePeriodDays: async (days) => {
    const existing = get().records.period_day;
    // allSettled, not all: if one request fails, the ones that did save must still land in
    // state — otherwise saving that date again would POST a duplicate record for it.
    const settled = await Promise.allSettled(
      days.map(async (data) => {
        const found = existing.find((r) => r.data.date === data.date);
        if (found) {
          await backend.update(found.id, data);
          return { ...found, data } as Rec<DataMap['period_day']>;
        }
        const row = await backend.create('period_day', data);
        return toRec<'period_day'>(row);
      }),
    );
    const results = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    set((s) => {
      const byDate = new Map(results.map((r) => [r.data.date, r]));
      const kept = s.records.period_day.filter((r) => !byDate.has(r.data.date));
      return { records: { ...s.records, period_day: [...kept, ...results] } };
    });
    if (results.length < days.length) throw new Error('Some period days could not be saved');
  },

  deletePeriodDay: async (date) => {
    const found = get().records.period_day.find((r) => r.data.date === date);
    if (found) await get().remove('period_day', found.id);
  },

  saveDoctorNote: async (text) => {
    const current = get().records.doctor_note[0];
    if (current) await get().update('doctor_note', current.id, { text });
    else await get().create('doctor_note', { text });
  },

  clearSampleData: () => {
    if (!IS_PREVIEW) return;
    set({ records: emptyBuckets() });
  },

  restoreSampleData: () => {
    if (!IS_PREVIEW) return;
    set({ records: sampleBuckets() });
  },
}));
