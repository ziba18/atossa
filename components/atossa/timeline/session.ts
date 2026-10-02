import { create } from 'zustand';

// Timeline view choices remembered for the session (not persisted): List/Month and the filter.

export type TimelineMode = 'list' | 'month';
export type TimelineFilter = 'All' | 'Symptoms' | 'Bleeding' | 'Appointments' | 'Medicines';

export const TIMELINE_FILTERS: TimelineFilter[] = ['All', 'Symptoms', 'Bleeding', 'Appointments', 'Medicines'];

interface TimelineSession {
  mode: TimelineMode;
  filter: TimelineFilter;
  setMode: (mode: TimelineMode) => void;
  setFilter: (filter: TimelineFilter) => void;
}

export const useTimelineSession = create<TimelineSession>((set) => ({
  mode: 'list',
  filter: 'All',
  setMode: (mode) => set({ mode }),
  setFilter: (filter) => set({ filter }),
}));
