import { create } from 'zustand';
import type { CycleLog, SymptomLog, CyclePrediction } from '../types/database';
import { api } from '../lib/api';
import {
  predictMissedPeriods,
  type MissedPeriodSuggestion,
} from '../algorithms/predict';
import { schedulePeriodReminder, scheduleOvulationReminder, cancelAllScheduledNotifications } from '../lib/notifications';

interface CycleState {
  cycleLogs: CycleLog[];
  symptomLogs: SymptomLog[];
  prediction: CyclePrediction | null;
  missedPeriodSuggestions: MissedPeriodSuggestion[];
  isLoading: boolean;
  fetchCycleLogs: (userId?: string) => Promise<void>;
  fetchSymptomLogs: (userId?: string, date?: string) => Promise<void>;
  fetchPrediction: (userId?: string) => Promise<void>;
  recomputePrediction: (userId?: string) => Promise<CyclePrediction | null>;
  refreshMissedPeriods: (userId?: string) => Promise<void>;
  dismissMissedPeriod: (date: string) => void;
  addCycleLog: (log: Partial<CycleLog>) => Promise<CycleLog | null>;
  addSymptomLog: (log: Partial<SymptomLog>) => Promise<SymptomLog | null>;
}

export const useCycleStore = create<CycleState>((set, get) => ({
  cycleLogs: [],
  symptomLogs: [],
  prediction: null,
  missedPeriodSuggestions: [],
  isLoading: false,

  fetchCycleLogs: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<CycleLog[]>('/cycles?limit=24');
      set({ cycleLogs: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchSymptomLogs: async (_userId, date) => {
    try {
      const path = date
        ? `/cycles/symptoms?date=${date}&limit=100`
        : '/cycles/symptoms?limit=100';
      const data = await api.get<SymptomLog[]>(path);
      set({ symptomLogs: data });
    } catch {}
  },

  fetchPrediction: async () => {
    try {
      const data = await api.get<CyclePrediction | null>('/cycles/prediction');
      set({ prediction: data });
    } catch {}
  },

  recomputePrediction: async () => {
    try {
      const prediction = await api.post<CyclePrediction>('/cycles/prediction/recompute');
      set({ prediction });

      await cancelAllScheduledNotifications();
      if (prediction.next_period_start) await schedulePeriodReminder(prediction.next_period_start);
      if (prediction.next_ovulation) await scheduleOvulationReminder(prediction.next_ovulation);

      await get().refreshMissedPeriods();

      return prediction;
    } catch {
      return null;
    }
  },

  refreshMissedPeriods: async () => {
    try {
      const cutoff = new Date(Date.now() - 100 * 86400000).toISOString().slice(0, 10);
      const [logs, symptoms] = await Promise.all([
        api.get<CycleLog[]>('/cycles?limit=100'),
        api.get<SymptomLog[]>(`/cycles/symptoms?since=${cutoff}&limit=500`),
      ]);
      const suggestions = await predictMissedPeriods(logs, symptoms);
      set({ missedPeriodSuggestions: suggestions });
    } catch {}
  },

  dismissMissedPeriod: (date) => {
    set((state) => ({
      missedPeriodSuggestions: state.missedPeriodSuggestions.filter((s) => s.date !== date),
    }));
  },

  addCycleLog: async (log) => {
    try {
      const newLog = await api.post<CycleLog>('/cycles', {
        period_start: log.period_start,
        period_end: log.period_end ?? null,
        cycle_length: log.cycle_length ?? null,
        period_length: log.period_length ?? null,
        flow_intensity: log.flow_intensity ?? null,
        notes: log.notes ?? null,
      });
      set((state) => ({ cycleLogs: [newLog, ...state.cycleLogs] }));
      await get().recomputePrediction();
      return newLog;
    } catch {
      return null;
    }
  },

  addSymptomLog: async (log) => {
    try {
      const newLog = await api.post<SymptomLog>('/cycles/symptoms', {
        logged_date: log.logged_date,
        logged_time: log.logged_time,
        symptom_type: log.symptom_type,
        severity: log.severity ?? null,
        custom_label: log.custom_label ?? null,
        notes: log.notes ?? null,
      });
      set((state) => ({ symptomLogs: [newLog, ...state.symptomLogs] }));
      return newLog;
    } catch {
      return null;
    }
  },
}));
