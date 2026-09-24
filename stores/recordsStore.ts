import { create } from 'zustand';
import { api } from '../lib/api';
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
}

const toRec = <K extends RecordKind>(row: ServerRecord): Rec<DataMap[K]> => ({
  id: row.id,
  data: row.data as DataMap[K],
  createdAt: row.created_at,
});

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: emptyBuckets(),
  loadedFor: null,
  loading: false,
  error: '',

  load: async (userId) => {
    set({ loading: true, error: '' });
    try {
      const { records } = await api.get<{ records: ServerRecord[] }>('/records');
      const buckets = emptyBuckets();
      for (const row of records) (buckets[row.kind] as Rec<any>[]).push(toRec(row));
      set({ records: buckets, loadedFor: userId, loading: false });
    } catch {
      set({ loading: false, error: "We couldn't load your information. Check your connection and try again." });
    }
  },

  reset: () => set({ records: emptyBuckets(), loadedFor: null, loading: false, error: '' }),

  create: async (kind, data) => {
    const row = await api.post<ServerRecord>('/records', { kind, data });
    const rec = toRec<typeof kind>(row);
    set((s) => ({ records: { ...s.records, [kind]: [...(s.records[kind] as Rec<any>[]), rec] } as Buckets }));
    return rec;
  },

  update: async (kind, id, data) => {
    await api.put<ServerRecord>(`/records/${id}`, { data });
    set((s) => ({
      records: {
        ...s.records,
        [kind]: (s.records[kind] as Rec<any>[]).map((r) => (r.id === id ? { ...r, data } : r)),
      } as Buckets,
    }));
  },

  remove: async (kind, id) => {
    await api.delete<void>(`/records/${id}`);
    set((s) => ({
      records: { ...s.records, [kind]: (s.records[kind] as Rec<any>[]).filter((r) => r.id !== id) } as Buckets,
    }));
  },

  savePeriodDays: async (days) => {
    const existing = get().records.period_day;
    const results = await Promise.all(
      days.map(async (data) => {
        const found = existing.find((r) => r.data.date === data.date);
        if (found) {
          await api.put<ServerRecord>(`/records/${found.id}`, { data });
          return { ...found, data } as Rec<DataMap['period_day']>;
        }
        const row = await api.post<ServerRecord>('/records', { kind: 'period_day', data });
        return toRec<'period_day'>(row);
      }),
    );
    set((s) => {
      const byDate = new Map(results.map((r) => [r.data.date, r]));
      const kept = s.records.period_day.filter((r) => !byDate.has(r.data.date));
      return { records: { ...s.records, period_day: [...kept, ...results] } };
    });
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
}));
