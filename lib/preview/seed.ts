// The "Sam" persona used in design-preview mode — ported from the Lovable prototype
// (design/lovable-reference/AtossaApp.tsx, initial* arrays) and mapped onto our record types.
// Preview "today" is 2026-09-24 (lib/preview/flag.ts).
import type {
  AppointmentData, DataMap, HistoryData, MedicineData, PeriodDayData, Rec, RecordKind, SymptomData,
} from '../../types/records';
import type { Profile } from '../../types/database';
import { PREVIEW_USER_ID } from './flag';

const symptom = (
  date: string, words: string, where: string, worst: number, duration: string, stopped: boolean, stoppedWords: string,
  extra: Partial<SymptomData> = {},
): SymptomData => ({
  date, words, where, worst, score: worst, duration, stopped, stoppedWords, source: 'typed',
  zones: [
    'Lower tummy centre',
    ...(/legs/i.test(where) ? ['Legs'] : []),
    ...(/back/i.test(where) ? ['Lower back'] : []),
  ],
  ...extra,
});

const SYMPTOMS: SymptomData[] = [
  // Seed v3 (data agent): pain with sex, skin and hair, eating, low-pain days, fatigue scores.
  symptom('2026-07-08', 'Dull ache low down that would not settle.', 'Lower belly', 4, 'Most of the evening', false, ''),
  symptom('2026-07-12', 'A mild ache low down, easy to ignore today.', 'Lower belly', 2, 'An hour or so', false, '', { fatigue: 3 }),
  symptom('2026-07-16', 'Deep pain inside during sex, so we had to stop. The ache stayed into the next morning.', 'Deep inside', 6, 'Into the next morning', true, 'We had to stop.', { impacts: ['Sex'], zones: ['Deep inside'] }),
  symptom('2026-07-19', 'Sharp pain across my lower belly and my back felt tight.', 'Lower belly and lower back', 6, 'About three hours', true, 'I had to cancel plans.'),
  symptom('2026-07-25', 'Stinging, dragging pain low down when I passed urine, and I needed to go much more often. It felt sore all day.', 'Lower belly, just above the pubic bone', 5, 'All day, worse each time I went', true, 'I could not concentrate at work.', { urinePain: true }),
  symptom('2026-07-31', 'Tired all day and a heavy feeling low down.', 'Lower belly', 5, 'All day', false, '', { fatigue: 7 }),
  symptom('2026-08-03', 'My skin has broken out on my chin and jaw again, and I keep finding more hair on my chin.', 'Chin and jaw', 2, 'For about two weeks', false, '', { skinHair: ['Spots or acne', 'Extra hair'], zones: [], whereText: 'Chin and jaw' }),
  symptom('2026-08-09', 'Squeezing pain that came in waves.', 'Across my lower belly', 7, 'On and off all day', true, 'I left work early.', { mood: 'Low and flat all day, and I cried on the way home.' }),
  symptom('2026-08-12', 'Hardly any pain today, just tired.', 'Lower belly', 1, 'On and off', false, '', { fatigue: 6, eating: 'Not hungry, I only managed toast.' }),
  symptom('2026-08-16', 'Pain down both legs and I felt very worn out.', 'Lower belly and legs', 7, 'From lunchtime until bedtime', true, 'I could not cook.', { fatigue: 7 }),
  symptom('2026-08-22', 'It hurt low down when I opened my bowels, a sharp stabbing pain deep inside. It only happens around my period.', 'Lower belly and deep inside', 7, 'A few minutes each time, then an ache for about an hour', true, 'I was late for work because I could not leave the toilet.', { bowelPain: true, zones: ['Lower tummy centre', 'Deep inside', 'Bottom'] }),
  symptom('2026-08-24', 'A dull, heavy pain low down.', 'Lower belly', 5, 'A few hours', false, ''),
  symptom('2026-08-29', 'I noticed some bleeding after sex, and it was sore deep inside afterwards.', 'Deep inside', 4, 'About an hour', true, 'I did not want to try again.', { impacts: ['Sex'], bleedingAfterSex: true, zones: ['Deep inside'] }),
  symptom('2026-09-02', 'Sharp pain across my lower belly.', 'Across my lower belly', 8, 'Most of the morning', true, 'I was too sore to get out of bed.', { mood: 'Irritable and worn down, I snapped at people.' }),
  symptom('2026-09-05', 'A light ache, I could get on with my day.', 'Lower belly', 3, 'Most of the afternoon', false, '', { fatigue: 4 }),
  symptom('2026-09-07', 'Squeezing pain and I felt dizzy.', 'Lower belly', 6, 'About four hours', false, ''),
  symptom('2026-09-09', 'More hair coming out in the shower than usual, and my clothes feel tighter even though I am eating less.', 'Scalp', 1, 'For a few weeks', false, '', { skinHair: ['Hair loss'], eating: 'Eating less but my clothes feel tighter.', zones: [], whereText: 'Scalp' }),
  symptom('2026-09-11', 'Squeezing pain across my lower belly. I have had pain like this for about 12 years.', 'Across my lower belly', 6, 'On and off all day', false, ''),
  symptom('2026-09-13', 'Sharp pain across my lower belly and down both legs.', 'Lower belly and both legs', 8, 'Most of the morning', true, 'I was too sore to go to work.'),
  symptom('2026-09-15', 'I felt very tired and had a heavy, squeezing pain low down.', 'Lower belly', 6, 'From lunchtime until bedtime', false, '', { fatigue: 7 }),
  symptom('2026-09-17', 'The pain was sharp and went down my legs. I also felt dizzy and lightheaded.', 'Lower belly and legs', 9, 'About five hours', true, "I couldn't stand up without help."),
  symptom('2026-09-19', 'Squeezing pain across my lower belly and I felt very tired.', 'Across my lower belly', 7, 'On and off all day', true, 'I had to lie down for the afternoon.', { fatigue: 7 }),
  symptom('2026-09-21', 'Sharp pain low down that was worse during my period.', 'Lower belly', 8, 'From early morning until evening', true, 'I could not do the shopping or cook.'),
  symptom('2026-09-23', 'Strong squeezing pain across my lower belly, sometimes running down my legs.', 'Lower belly and legs', 8, 'About six hours', true, 'I had to leave work and go home.'),
  symptom('2026-09-24', 'Very sharp pain across my lower belly. I feel dizzy, lightheaded and very tired.', 'Across my lower belly and down my legs', 9, 'Since early this morning', true, "I couldn't move around or stand without help.", { fatigue: 7 }),
];

type Flow = NonNullable<PeriodDayData['flow']>;
const period = (dates: [string, Flow, string?][]): PeriodDayData[] =>
  dates.map(([date, flow, note], i) => {
    const status = i === 0 ? 'started' : i === dates.length - 1 ? 'ended' : 'ongoing';
    return { date, status, isStart: status === 'started', isEnd: status === 'ended', flow, note: note ?? '' };
  });

const PERIOD_DAYS: PeriodDayData[] = [
  ...period([['2026-09-18', 'Medium'], ['2026-09-19', 'Heavy'], ['2026-09-20', 'Heavy'], ['2026-09-21', 'Medium'], ['2026-09-22', 'Medium'], ['2026-09-23', 'Medium']]),
  ...period([['2026-08-21', 'Medium'], ['2026-08-22', 'Heavy', 'Had to change every hour'], ['2026-08-23', 'Heavy'], ['2026-08-24', 'Medium'], ['2026-08-25', 'Medium'], ['2026-08-26', 'Medium']]),
  ...period([['2026-07-24', 'Medium'], ['2026-07-25', 'Heavy'], ['2026-07-26', 'Heavy'], ['2026-07-27', 'Medium'], ['2026-07-28', 'Medium'], ['2026-07-29', 'Medium']]),
  ...period([['2026-06-26', 'Medium'], ['2026-06-27', 'Heavy'], ['2026-06-28', 'Heavy'], ['2026-06-29', 'Heavy'], ['2026-06-30', 'Medium'], ['2026-07-01', 'Medium'], ['2026-07-02', 'Medium']]),
];

const APPOINTMENTS: AppointmentData[] = [
  { date: '2015-06-01', datePrecision: 'month', who: 'GP', why: 'Very sharp pain during my periods and heavy bleeding', told: 'The ultrasound showed nothing. Maybe it could be in your mind.', tests: 'Ultrasound. Birth control pills and pain relievers.', next: 'Come back if it continues.', notes: '' },
  { date: '2018-05-01', datePrecision: 'month', who: 'Different clinic', why: 'The pain was getting worse each month', told: "We didn't find anything on the scan.", tests: 'Another ultrasound. Pain relievers.', next: 'Return if it gets worse.', notes: '' },
  { date: '2020-03-01', datePrecision: 'month', who: 'Hospital clinic', why: 'Ongoing pain and heavy bleeding', told: 'There are fibroids, and another problem with my bowel.', tests: 'A procedure was arranged for the fibroids.', next: 'Follow up after the procedure.', notes: '' },
  { date: '2026-09-24', datePrecision: 'exact', who: 'Specialist clinic', why: 'The pain is too much to work or move around', told: '', tests: 'An examination, an ultrasound and an MRI were arranged.', next: '', notes: "I arrived crying and couldn't stand without help." },
];

const MEDICINES: MedicineData[] = [
  { name: 'Birth control pills', started: '2015-06-01', startedPrecision: 'month', stopped: '2016-06-01', stoppedPrecision: 'month', happened: 'No relief from the pain.', helped: 'No' },
  { name: 'Pain relievers', started: '2015-06-01', startedPrecision: 'month', stopped: '', stoppedPrecision: 'exact', happened: 'Sometimes helps for a short while, often no relief.', helped: 'A little' },
  { name: 'Cortisone injections at the emergency department', started: '2019-04-01', startedPrecision: 'month', stopped: '2019-04-01', stoppedPrecision: 'month', happened: 'Gave me a little relief for a few days.', helped: 'A little' },
];

const HISTORY: HistoryData[] = [
  { type: 'Test or scan', date: '2015-06-01', datePrecision: 'month', told: 'Nothing was found.', done: 'Ultrasound', result: 'I was sent home with no answers.' },
  { type: 'Test or scan', date: '2018-05-01', datePrecision: 'month', told: 'Nothing was found.', done: 'Ultrasound', result: 'Still no explanation for the pain.' },
  { type: 'Emergency visit', date: '2019-04-01', datePrecision: 'month', told: '', done: 'Cortisone injection and pain medication', result: 'Some relief for a few days, then the pain came back.' },
  { type: 'Told to me by a doctor', date: '2020-03-01', datePrecision: 'month', told: 'I have fibroids and another problem with my bowel.', done: '', result: 'I was told these could be part of it.' },
  { type: 'Procedure or surgery', date: '2020-06-01', datePrecision: 'month', told: '', done: 'A procedure for the fibroids', result: 'The pain eased for a while, then it came back.' },
];

type Buckets = { [K in RecordKind]: Rec<DataMap[K]>[] };

// The newest record keeps 14:10 (the pinned preview day); older ones vary so the Timeline doesn't read as one batch.
const TIMES = ['14:10', '08:35', '19:20', '12:05', '21:40', '07:50', '16:25'];
const recs = <T,>(kind: string, items: T[], dateOf: (t: T) => string): Rec<T>[] =>
  items.map((data, i) => ({ id: `seed-${kind}-${i + 1}`, data, createdAt: `${dateOf(data)}T${TIMES[i % TIMES.length]}:00.000Z` }));

/** A fresh deep copy of Sam's records, every call (so edits never mutate the seed). */
export function sampleBuckets(): Buckets {
  // Design preview only: /doctor?seed=empty shows the first-run screens (no records at all).
  if (typeof window !== 'undefined' && /[?&]seed=empty\b/.test(window.location?.search ?? '')) {
    return { symptom: [], period_day: [], appointment: [], medicine: [], history: [], doctor_note: [] };
  }
  const copy = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  // Design preview only: ?seed=few keeps the six oldest notes (below the 7 that unlock "See your patterns").
  const few = typeof window !== 'undefined' && /[?&]seed=few\b/.test(window.location?.search ?? '');
  // Design preview only: ?seed=noappt drops the appointments, to render the non-appointment-day screens.
  const noAppt = typeof window !== 'undefined' && /[?&]seed=noappt\b/.test(window.location?.search ?? '');
  return {
    symptom: recs('symptom', copy(few ? [...SYMPTOMS].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6) : SYMPTOMS), (d) => d.date),
    period_day: recs('period', copy(PERIOD_DAYS), (d) => d.date),
    appointment: recs('appointment', copy(noAppt ? [] : APPOINTMENTS), (d) => d.date),
    medicine: recs('medicine', copy(MEDICINES), (d) => d.started),
    history: recs('history', copy(HISTORY), (d) => d.date),
    doctor_note: [],
  };
}

export const PREVIEW_PROFILE: Profile = {
  id: PREVIEW_USER_ID,
  display_name: 'Sam',
  date_of_birth: null,
  avatar_url: null,
  average_cycle_length: 28,
  average_period_length: 6,
  cycle_regularity: 'unknown',
  onboarding_complete: true,
  timezone: 'Europe/London',
  dark_mode: false,
  notifications_enabled: false,
  daily_log_reminder_enabled: false,
  daily_log_reminder_time: '20:00',
  created_at: '2026-09-01T09:00:00.000Z',
  updated_at: '2026-09-01T09:00:00.000Z',
};

export const PREVIEW_EMAIL = 'sam@example.com';
