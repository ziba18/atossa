import { create } from 'zustand';
import type { AlertLog } from '../types/database';
import { supabase } from '../lib/supabase';

interface AlertState {
  alerts: AlertLog[];
  unreadCount: number;
  fetchAlerts: (userId: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,

  fetchAlerts: async (userId) => {
    const { data } = await supabase
      .from('alert_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    const alerts = (data ?? []) as AlertLog[];
    set({ alerts, unreadCount: alerts.filter((a) => !a.is_read).length });
  },

  markAllRead: async (userId) => {
    await supabase
      .from('alert_logs')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, is_read: true })),
      unreadCount: 0,
    }));
  },
}));
