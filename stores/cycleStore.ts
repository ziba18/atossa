import { create } from 'zustand';
import type { CycleLog, SymptomLog, CyclePrediction } from '../types/database';
import { supabase } from '../lib/supabase';
import { computeCyclePrediction } from '../algorithms/cyclePrediction';
import { schedulePeriodReminder, scheduleOvulationReminder, cancelAllScheduledNotifications } from '../lib/notifications';

interface CycleState {
  cycleLogs: CycleLog[];
  symptomLogs: SymptomLog[];
  prediction: CyclePrediction | null;
  isLoading: boolean;
  fetchCycleLogs: (userId: string) => Promise<void>;
  fetchSymptomLogs: (userId: string, date?: string) => Promise<void>;
  fetchPrediction: (userId: string) => Promise<void>;
  addCycleLog: (log: Partial<CycleLog>) => Promise<CycleLog | null>;
  addSymptomLog: (log: Partial<SymptomLog>) => Promise<SymptomLog | null>;
}

export const useCycleStore = create<CycleState>((set, get) => ({
  cycleLogs: [],
  symptomLogs: [],
  prediction: null,
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

    // Compute and persist prediction after every new log
    const userId = log.user_id as string;
    if (userId) {
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
      const result = computeCyclePrediction({
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

      if (upserted) {
        set({ prediction: upserted as CyclePrediction });

        // Reschedule notifications with fresh prediction
        await cancelAllScheduledNotifications();
        await schedulePeriodReminder(result.nextPeriodStart);
        await scheduleOvulationReminder(result.nextOvulation);
      }
    }

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
