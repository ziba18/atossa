import { create } from 'zustand';

// Timeline view choices remembered for the session (not persisted): List/Month and the filter.

export type TimelineMode = 'list' | 'month' | 'patterns';
export type TimelineFilter = 'All' | 'Symptoms' | 'Bleeding' | 'Appointments' | 'Medicines' | 'Bowel or bladder' | 'Tiredness';

export const TIMELINE_FILTERS: TimelineFilter[] = ['All', 'Symptoms', 'Bleeding', 'Bowel or bladder', 'Tiredness', 'Appointments', 'Medicines'];
/** Area chips only appear once a note belongs to them (no dead chips); the rest are always there. */
export const AREA_FILTERS: TimelineFilter[] = ['Bowel or bladder', 'Tiredness'];

/** A count from For my doctor opened as a list: exactly these dated days, named by the row's own label. */
export interface DayFilter { label: string; dates: string[]; /** Which entries on those days: notes (default) or bleeding days. */ kind?: 'symptom' | 'bleeding' }

interface TimelineSession {
  dayFilter: DayFilter | null;
  setDayFilter: (d: DayFilter | null) => void;
  mode: TimelineMode;
  filter: TimelineFilter;
  /** Patterns week bar tapped: the list scrolls to the first week group inside this day range (consumed once). */
  focusWeek: { from: string; to: string } | null;
  setFocusWeek: (w: { from: string; to: string } | null) => void;
  /** A day tapped on Today's strip: Timeline opens that day's sheet (consumed once). */
  openDay: string | null;
  setOpenDay: (d: string | null) => void;
  setMode: (mode: TimelineMode) => void;
  setFilter: (filter: TimelineFilter) => void;
}

export const useTimelineSession = create<TimelineSession>((set) => ({
  dayFilter: null,
  setDayFilter: (dayFilter) => set({ dayFilter, filter: 'All', mode: 'list' }),
  mode: 'list',
  filter: 'All',
  focusWeek: null,
  setFocusWeek: (focusWeek) => set({ focusWeek }),
  openDay: null,
  setOpenDay: (openDay) => set({ openDay }),
  setMode: (mode) => set({ mode }),
  setFilter: (filter) => set({ filter, dayFilter: null }),
}));
