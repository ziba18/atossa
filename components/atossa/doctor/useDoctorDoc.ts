// Session state for the For my doctor builder (lives until the app is closed) and the one hook
// that turns records + builder choices into the DoctorDoc used by the builder, the preview,
// Show on screen and the PDF.
import { useMemo } from 'react';
import { create } from 'zustand';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import { isHumanName } from '../../../lib/humanName';
import { todayKey } from '../../../lib/records/dates';
import {
  SINCE_MAX_MONTHS, buildDoctorSummary, monthsBefore, sinceNote, type DoctorDoc, type RangeChoice, type SectionId, type VisitType,
} from '../../../lib/records/summary';
import type { AppointmentData, Rec } from '../../../types/records';

interface BuilderState {
  visitType: VisitType | null;
  /** null = not chosen yet → default (since last appointment if there is one, else 3 months). */
  range: RangeChoice | null;
  agenda: string;
  /** True once Sam has typed in the agenda field this session (stops the saved note overwriting it). */
  agendaTouched: boolean;
  include: Partial<Record<SectionId, boolean>>;
  setVisitType: (v: VisitType | null) => void;
  setRange: (r: RangeChoice) => void;
  setAgenda: (t: string) => void;
  loadAgenda: (t: string) => void;
  setInclude: (id: SectionId, on: boolean) => void;
}

export const useDoctorBuilder = create<BuilderState>((set) => ({
  visitType: null,
  range: null,
  agenda: '',
  agendaTouched: false,
  include: {},
  setVisitType: (visitType) => set({ visitType }),
  setRange: (range) => set({ range }),
  setAgenda: (agenda) => set({ agenda, agendaTouched: true }),
  loadAgenda: (agenda) => set((s) => (s.agendaTouched ? s : { agenda })),
  setInclude: (id, on) => set((s) => ({ include: { ...s.include, [id]: on } })),
}));

/** Upcoming (today or later, exact date) appointment and the last one before today. */
export function appointmentAnchors(appointments: Rec<AppointmentData>[], today: string) {
  const dated = appointments.map((r) => r).filter((r) => r.data.date);
  const upcoming = dated
    .filter((r) => r.data.datePrecision === 'exact' && r.data.date >= today)
    .sort((a, b) => a.data.date.localeCompare(b.data.date))[0];
  const last = dated
    .filter((r) => r.data.date < today)
    .sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
  return { upcoming, last };
}

export function useDoctorDoc(): {
  doc: DoctorDoc;
  range: RangeChoice;
  hasLast: boolean;
  /** Line under the range choice when "Since last appointment" is chosen ('' otherwise). */
  rangeNote: string;
  upcoming?: Rec<AppointmentData>;
  last?: Rec<AppointmentData>;
} {
  const records = useRecordsStore((s) => s.records);
  const rawName = useAuthStore((s) => s.profile?.display_name);
  const { visitType, range: chosen, agenda, include } = useDoctorBuilder();
  const today = todayKey();

  return useMemo(() => {
    const { upcoming, last } = appointmentAnchors(records.appointment, today);
    // "Since last appointment" = since the last appointment BEFORE today, reaching back at most
    // 6 months (an appointment years ago would otherwise make a years-long range). It's the
    // default only when that appointment is recent enough to be a real "since".
    const cap = monthsBefore(today, SINCE_MAX_MONTHS);
    const lastRecent = Boolean(last && last.data.date >= cap);
    const range: RangeChoice = chosen === 'since' && !last ? '3m' : chosen ?? (lastRecent ? 'since' : '3m');
    const from = range === 'since' && last
      ? (lastRecent ? last.data.date : cap)
      : monthsBefore(today, range === '6m' ? 6 : 3);
    const rangeNote = range === 'since' && last ? sinceNote(last.data.date, last.data.datePrecision, !lastRecent) : '';
    const doc = buildDoctorSummary(
      {
        symptoms: records.symptom,
        periodDays: records.period_day,
        medicines: records.medicine,
        history: records.history,
        appointments: records.appointment,
        name: isHumanName(rawName) ? rawName!.trim() : undefined,
      },
      { from, to: today, today, visitType, agenda, include, appointmentToday: upcoming?.data.date === today },
    );
    return { doc, range, hasLast: Boolean(last), rangeNote, upcoming, last };
  }, [records, rawName, visitType, chosen, agenda, include, today]);
}
