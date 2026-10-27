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

/** How a symptom note was captured. 'quick' = the Today "Rough day" log, which has NO words. */
export type CaptureSource = 'voice' | 'typed' | 'quick';
export type StrengthText = 'It varies' | 'Not sure';

/**
 * One symptom note. Older saved records only have date/words/where/score/duration/stopped/
 * stoppedWords, so every newer field is optional and readers must tolerate its absence.
 * Read strength through lib/records/format.ts (`worstOf`, `formatStrength`), never `score` directly.
 */
export interface SymptomData {
  date: string;
  /** Sam's own words, verbatim (voice transcript or typed). '' for a quick "Rough day" log. */
  words: string;
  where: string;
  /**
   * Legacy single 0–10 score = "at worst". New code writes `worst` (and keeps `score` equal to it
   * for older readers); null/absent when no strength was given.
   */
  score?: number | null;
  /** 0–10 "usually". */
  typical?: number | null;
  /** 0–10 "at worst". */
  worst?: number | null;
  /** Chosen instead of a number. */
  strengthText?: StrengthText;
  /** Named body zones (BodyZonePicker), e.g. 'Lower tummy left'. */
  zones?: string[];
  /**
   * "Where" beyond the zones: her own words ("rash on my arms") or 'Not sure' / 'It varies'.
   * Newer notes only; `where` stays the combined display string for older readers.
   */
  whereText?: string;
  /** "Got in the way of" chips. Never contains 'Not sure' / 'Skip' (filter before counting). */
  impacts?: string[];
  /**
   * "When" — period timing: a WHEN_OPTIONS value ('Only around my period' …), 'Not sure' /
   * 'It varies', or her own phrase. NOT how long it has lasted (that is `duration`). Older notes
   * may hold "Since Tuesday" here — read via `splitTiming()` / `formatWhen()` in format.ts.
   */
  when?: string;
  /** What has been tried, in Sam's words. */
  tried?: string;
  source?: CaptureSource;
  /** Starter chip that opened the capture ('Pain today', …). Internal — never displayed as Sam's words. */
  tag?: string;
  /**
   * When the note was written (ISO 8601), set by new captures and Rough day ONLY when the note is
   * about today — a note back-dated to another day has no time of its own. Readers show its local
   * time ("· 15:10") and sort same-day notes by it; older notes fall back to the record's createdAt.
   */
  createdAt?: string;
  /** "How long" — her words for how long it has been going on ("Since Tuesday"); '' if not given. */
  duration: string;
  /** Legacy "stopped me doing things". New captures derive it from `impacts.length > 0`. */
  stopped: boolean | null;
  stoppedWords: string;
  /**
   * Holistic fields (PRODUCT §4), all optional and patient-entered or pre-filled only from her own
   * words (components/atossa/capture/holistic.ts on the AI branches). Absent = not recorded.
   */
  /** Pads/tampons per day as the chip bands ('1-2' | '3-5' | '6+'), flooding, clots — as reported. */
  products?: '1-2' | '3-5' | '6+';
  flooding?: boolean;
  clots?: boolean;
  bleedingBetween?: boolean;
  bleedingAfterSex?: boolean;
  bowelPain?: boolean;
  urinePain?: boolean;
  /** Tiredness 0–10 as given. */
  fatigue?: number | null;
  /** Skin and hair chips as reported ('Spots or acne', 'Extra hair', 'Hair loss', 'Dark patches'). */
  skinHair?: string[];
  /** Mood in her own words (sensitive). */
  mood?: string;
  /** Weight or eating in her own words (sensitive). */
  eating?: string;
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
  dose?: string;
  started: string;
  startedPrecision: DatePrecision;
  stopped: string; // '' = ongoing
  stoppedPrecision: DatePrecision;
  happened: string;
  /** "Did it help?" as she answered it (Phendo pattern); absent = not answered. */
  helped?: 'Helped' | 'A little' | 'No' | 'Not sure';
  /** Side effects in her own words. */
  sideEffects?: string;
}

export interface HistoryData {
  type: HistoryType;
  date: string;
  datePrecision: DatePrecision;
  told: string;
  done: string;
  result: string;
}

/** Log-bleeding status. Spotting is its own status — never inferred from flow. */
export type BleedingStatus = 'started' | 'ongoing' | 'ended' | 'spotting';

/**
 * One logged bleeding day. Older records have isStart/isEnd/flow but no `status`; read the
 * status through `bleedingStatus()` in lib/records/format.ts. `flow` is optional with no default.
 */
export interface PeriodDayData {
  date: string;
  status?: BleedingStatus;
  isStart: boolean;
  isEnd: boolean;
  flow?: Flow;
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
  /** Saved on this phone, not yet sent (offline outbox). */
  pending?: boolean;
}

export interface Cycle {
  start: string;
  end?: string;
  length?: number; // period length in days, inclusive
  cycleLength?: number; // days from this start to the next start
}
