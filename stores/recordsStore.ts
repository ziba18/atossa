import { create } from 'zustand';
import { api } from '../lib/api';
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
const previewBackend: Backend = {
  list: async () => sampleBuckets(),
  create: async (kind, data) => {
    // Preview only: reviewers/screenshots set globalThis.__PREVIEW_OFFLINE__ = true to see the failed-save state.
    if ((globalThis as { __PREVIEW_OFFLINE__?: boolean }).__PREVIEW_OFFLINE__) throw new Error('offline');
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
      set({ records: buckets, loadedFor: userId, loading: false });
    } catch {
      set({ loading: false, error: "We couldn't load your information. Check your connection and try again." });
    }
  },

  reset: () => set({ records: emptyBuckets(), loadedFor: null, loading: false, error: '' }),

  create: async (kind, data) => {
    const row = await backend.create(kind, data);
    const rec = toRec<typeof kind>(row);
    set((s) => ({ records: { ...s.records, [kind]: [...(s.records[kind] as Rec<any>[]), rec] } as Buckets }));
    return rec;
  },

  update: async (kind, id, data) => {
    await backend.update(id, data);
    set((s) => ({
      records: {
        ...s.records,
        [kind]: (s.records[kind] as Rec<any>[]).map((r) => (r.id === id ? { ...r, data } : r)),
      } as Buckets,
    }));
  },

  remove: async (kind, id) => {
    await backend.remove(id);
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
