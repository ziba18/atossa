import { create } from 'zustand';

// Timeline view choices remembered for the session (not persisted): List/Month and the filter.

export type TimelineMode = 'list' | 'month' | 'patterns';
export type TimelineFilter = 'All' | 'Symptoms' | 'Bleeding' | 'Appointments' | 'Medicines';

export const TIMELINE_FILTERS: TimelineFilter[] = ['All', 'Symptoms', 'Bleeding', 'Appointments', 'Medicines'];

interface TimelineSession {
  mode: TimelineMode;
  filter: TimelineFilter;
  /** Patterns week bar tapped: the list scrolls to the week group containing this day (consumed once). */
  focusDay: string | null;
  setFocusDay: (day: string | null) => void;
  setMode: (mode: TimelineMode) => void;
  setFilter: (filter: TimelineFilter) => void;
}

export const useTimelineSession = create<TimelineSession>((set) => ({
  mode: 'list',
  filter: 'All',
  focusDay: null,
  setFocusDay: (focusDay) => set({ focusDay }),
  setMode: (mode) => set({ mode }),
  setFilter: (filter) => set({ filter }),
}));
