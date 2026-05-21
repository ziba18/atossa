import { create } from 'zustand';
import type { CycleLog, SymptomLog, CyclePrediction } from '../types/database';
import { supabase } from '../lib/supabase';
import {
  predictCycle,
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
  fetchCycleLogs: (userId: string) => Promise<void>;
  fetchSymptomLogs: (userId: string, date?: string) => Promise<void>;
  fetchPrediction: (userId: string) => Promise<void>;
  recomputePrediction: (userId: string) => Promise<CyclePrediction | null>;
  refreshMissedPeriods: (userId: string) => Promise<void>;
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

  fetchCycleLogs: async (userId) => {
    set({ isLoading: true });
    const { data } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(24);
    set({ cycleLogs: (data ?? []) as CycleLog[], isLoading: false });
  },

  fetchSymptomLogs: async (userId, date) => {
    let query = supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_time', { ascending: false });
    if (date) query = query.eq('logged_date', date);
    const { data } = await query.limit(100);
    set({ symptomLogs: (data ?? []) as SymptomLog[] });
  },

  fetchPrediction: async (userId) => {
    const { data } = await supabase
      .from('cycle_predictions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    set({ prediction: data as CyclePrediction | null });
  },

  recomputePrediction: async (userId) => {
    const { data: allLogs } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: true });

    const { data: profileData } = await supabase
      .from('profiles')
      .select('average_cycle_length, average_period_length')
      .eq('id', userId)
      .maybeSingle();

    const sortedLogs = (allLogs ?? []) as CycleLog[];
    const result = await predictCycle({
      cycleLogs: sortedLogs,
      defaultCycleLength: profileData?.average_cycle_length ?? 28,
      defaultPeriodLength: profileData?.average_period_length ?? 5,
      userId,
    });

    const predictionRow = {
      user_id: userId,
      computed_at: new Date().toISOString(),
      next_period_start: result.nextPeriodStart,
      next_period_end: result.nextPeriodEnd,
      next_ovulation: result.nextOvulation,
      fertile_window_start: result.fertileWindowStart,
      fertile_window_end: result.fertileWindowEnd,
      predicted_cycle_length: result.predictedCycleLength,
      confidence_score: result.confidenceScore,
      method_used: result.methodUsed,
    };

    const { data: upserted } = await supabase
      .from('cycle_predictions')
      .upsert(predictionRow, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (!upserted) return null;

    const prediction = upserted as CyclePrediction;
    set({ prediction });

    await cancelAllScheduledNotifications();
    await schedulePeriodReminder(result.nextPeriodStart);
    await scheduleOvulationReminder(result.nextOvulation);

    // Refresh backfill suggestions after a recompute too — a new log may
    // resolve a previously-suggested missed period.
    await get().refreshMissedPeriods(userId);

    return prediction;
  },

  refreshMissedPeriods: async (userId) => {
    // Pull a broader window of symptoms (90d backfill horizon) so the
    // classifier has enough signal. We don't disturb the main symptomLogs
    // slice (which is scoped to a viewing date) — we fetch ad-hoc here.
    const cutoff = new Date(Date.now() - 100 * 86400000).toISOString().slice(0, 10);
    const [{ data: logs }, { data: symptoms }] = await Promise.all([
      supabase
        .from('cycle_logs')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: true }),
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_date', cutoff),
    ]);
    const suggestions = await predictMissedPeriods(
      (logs ?? []) as CycleLog[],
      (symptoms ?? []) as SymptomLog[],
    );
    set({ missedPeriodSuggestions: suggestions });
  },

  dismissMissedPeriod: (date) => {
    set((state) => ({
      missedPeriodSuggestions: state.missedPeriodSuggestions.filter((s) => s.date !== date),
    }));
  },

  addCycleLog: async (log) => {
    const { data, error } = await supabase
      .from('cycle_logs')
      .insert(log)
      .select()
      .single();
    if (error) return null;
    const newLog = data as CycleLog;
    set((state) => ({
      cycleLogs: [newLog, ...state.cycleLogs],
    }));

    const userId = log.user_id as string;
    if (userId) await get().recomputePrediction(userId);

    return newLog;
  },

  addSymptomLog: async (log) => {
    const { data, error } = await supabase
      .from('symptom_logs')
      .insert(log)
      .select()
      .single();
    if (error) return null;
    const newLog = data as SymptomLog;
    set((state) => ({
      symptomLogs: [newLog, ...state.symptomLogs],
    }));
    return newLog;
  },
}));
