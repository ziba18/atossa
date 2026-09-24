// Shapes of the user-entered records kept in the backend's generic `health_records` store
// (see backend/app/models/record.py). Dates are 'YYYY-MM-DD'; when `*Precision` is 'month' or
// 'year' the day (and month) are placeholders and the UI shows "Around …".

export type DatePrecision = 'exact' | 'month' | 'year';
export type Flow = 'None' | 'Light' | 'Medium' | 'Heavy';
export type HistoryType =
  | 'Told to me by a doctor'
  | 'Test or scan'
  | 'Procedure or surgery'
  | 'Emergency visit';

export interface SymptomData {
  date: string;
  words: string;
  where: string;
  score: number; // 0–10
  duration: string;
  stopped: boolean;
  stoppedWords: string;
}

export interface AppointmentData {
  date: string;
  datePrecision: DatePrecision;
  who: string;
  why: string;
  told: string;
  tests: string;
  next: string;
  notes: string;
}

export interface MedicineData {
  name: string;
  started: string;
  startedPrecision: DatePrecision;
  stopped: string; // '' = ongoing
  stoppedPrecision: DatePrecision;
  happened: string;
}

export interface HistoryData {
  type: HistoryType;
  date: string;
  datePrecision: DatePrecision;
  told: string;
  done: string;
  result: string;
}

export interface PeriodDayData {
  date: string;
  isStart: boolean;
  isEnd: boolean;
  flow: Flow;
  note: string;
}

export interface DoctorNoteData {
  text: string;
}

export interface DataMap {
  symptom: SymptomData;
  appointment: AppointmentData;
  medicine: MedicineData;
  history: HistoryData;
  period_day: PeriodDayData;
  doctor_note: DoctorNoteData;
}

export type RecordKind = keyof DataMap;

export interface Rec<T> {
  id: string;
  data: T;
  createdAt: string;
}

export interface Cycle {
  start: string;
  end?: string;
  length?: number; // period length in days, inclusive
  cycleLength?: number; // days from this start to the next start
}
