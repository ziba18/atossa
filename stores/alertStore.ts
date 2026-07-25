import { create } from 'zustand';
import type { AlertLog } from '../types/database';

interface AlertState {
  alerts: AlertLog[];
  unreadCount: number;
  fetchAlerts: (userId?: string) => Promise<void>;
  markAllRead: (userId?: string) => Promise<void>;
}

// Alert backend endpoints are not yet migrated. Feature returns empty data
// until Phase 3 adds the /alerts router to the FastAPI backend.
export const useAlertStore = create<AlertState>(() => ({
  alerts: [],
  unreadCount: 0,
  fetchAlerts: async () => {},
  markAllRead: async () => {},
}));
