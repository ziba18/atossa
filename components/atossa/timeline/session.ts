import { create } from 'zustand';

// Timeline view choices remembered for the session (not persisted): List/Month and the filter.

export type TimelineMode = 'list' | 'month' | 'patterns';
export type TimelineFilter = 'All' | 'Symptoms' | 'Bleeding' | 'Appointments' | 'Medicines' | 'Bowel or bladder' | 'Tiredness';

export const TIMELINE_FILTERS: TimelineFilter[] = ['All', 'Symptoms', 'Bleeding', 'Bowel or bladder', 'Tiredness', 'Appointments', 'Medicines'];
/** Area chips only appear once a note belongs to them (no dead chips); the rest are always there. */
export const AREA_FILTERS: TimelineFilter[] = ['Bowel or bladder', 'Tiredness'];

interface TimelineSession {
  mode: TimelineMode;
  filter: TimelineFilter;
  /** Patterns week bar tapped: the list scrolls to the first week group inside this day range (consumed once). */
  focusWeek: { from: string; to: string } | null;
  setFocusWeek: (w: { from: string; to: string } | null) => void;
  setMode: (mode: TimelineMode) => void;
  setFilter: (filter: TimelineFilter) => void;
}

export const useTimelineSession = create<TimelineSession>((set) => ({
  mode: 'list',
  filter: 'All',
  focusWeek: null,
  setFocusWeek: (focusWeek) => set({ focusWeek }),
  setMode: (mode) => set({ mode }),
  setFilter: (filter) => set({ filter }),
}));
