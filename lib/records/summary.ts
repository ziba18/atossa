import type {
  AppointmentData, Cycle, HistoryData, MedicineData, PeriodDayData, Rec, SymptomData,
} from '../../types/records';
import {
  MONTH_NAMES, addDays, diffDays, formatDate, formatRecordDate, inclusiveDays, isFuture, parseKey, todayKey,
} from './dates';

// ---- cycles -------------------------------------------------------------------------------

/** Period days → one Cycle per logged start, newest first. Only arithmetic on the user's own dates. */
export function deriveCycles(days: PeriodDayData[]): Cycle[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const cycles: Cycle[] = [];
  for (const day of sorted) {
    if (day.isStart) cycles.push({ start: day.date });
    if (day.isEnd) {
      const open = [...cycles].reverse().find((c) => !c.end && c.start <= day.date);
      if (open) {
        open.end = day.date;
        open.length = inclusiveDays(open.start, day.date);
      }
    }
  }
  cycles.forEach((cycle, i) => {
    const next = cycles[i + 1];
    if (next) cycle.cycleLength = diffDays(cycle.start, next.start);
  });
  return cycles.reverse();
}

export function periodSummary(days: PeriodDayData[]): string {
  const latest = deriveCycles(days)[0];
  if (!latest) return 'No period dates logged';
  if (!latest.end) return `Period started: ${formatDate(latest.start, true)}`;
  const s = parseKey(latest.start);
  const e = parseKey(latest.end);
  if (s.y === e.y && s.m0 === e.m0) {
    return `Period logged: ${s.d}–${e.d} ${MONTH_NAMES[s.m0].slice(0, 3)}`;
  }
  return `Period logged: ${formatDate(latest.start, true)}–${formatDate(latest.end, true)}`;
}

// ---- symptoms -----------------------------------------------------------------------------

export function symptomStats(symptoms: SymptomData[]) {
  const stoppedDays = new Set(symptoms.filter((s) => s.stopped).map((s) => s.date)).size;
  const scores = symptoms.map((s) => s.score);
  return {
    stoppedDays,
    min: scores.length ? Math.min(...scores) : 0,
    max: scores.length ? Math.max(...scores) : 0,
  };
}

/** Distinct days marked "stopped me doing things" in each of the last `weeks` 7-day blocks (oldest first). */
export function weeklyStoppedDays(symptoms: SymptomData[], weeks = 4) {
  const today = todayKey();
  const out: { label: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDays(today, -7 * i);
    const start = addDays(end, -6);
    const days = new Set(
      symptoms.filter((s) => s.stopped && s.date >= start && s.date <= end).map((s) => s.date),
    );
    const a = parseKey(start);
    const b = parseKey(end);
    const label =
      a.m0 === b.m0
        ? `${a.d}–${b.d} ${MONTH_NAMES[b.m0].slice(0, 3)}`
        : `${a.d} ${MONTH_NAMES[a.m0].slice(0, 3)}–${b.d} ${MONTH_NAMES[b.m0].slice(0, 3)}`;
    out.push({ label, count: days.size });
  }
  return out;
}

// ---- doctor summary -----------------------------------------------------------------------

export interface SummaryRow { title: string; lines: string[] }
export interface SummarySection { key: string; title: string; count: number; rows: SummaryRow[] }
export interface DoctorSummary {
  rangeText: string;
  glance: SummaryRow[];
  sections: SummarySection[];
  notes: string;
}

interface SummaryInput {
  symptoms: Rec<SymptomData>[];
  periodDays: Rec<PeriodDayData>[];
  medicines: Rec<MedicineData>[];
  history: Rec<HistoryData>[];
  appointments: Rec<AppointmentData>[];
  notes: string;
}

const UPCOMING = ' · Upcoming';
const newestFirst = <T,>(items: T[], key: (t: T) => string) =>
  [...items].sort((a, b) => key(b).localeCompare(key(a)));
const nonEmpty = (...lines: (string | false | undefined)[]) => lines.filter((l): l is string => Boolean(l));

export function buildDoctorSummary(input: SummaryInput): DoctorSummary {
  const symptoms = newestFirst(input.symptoms.map((r) => r.data), (s) => s.date);
  const stopped = symptoms.filter((s) => s.stopped);
  const cycles = deriveCycles(input.periodDays.map((r) => r.data)).filter((c) => c.end && c.length);
  const medicines = newestFirst(input.medicines.map((r) => r.data), (m) => m.started);
  const history = newestFirst(input.history.map((r) => r.data), (h) => h.date);
  const appointments = newestFirst(input.appointments.map((r) => r.data), (a) => a.date);
  const stats = symptomStats(symptoms);
  const oldest = symptoms[symptoms.length - 1]?.date;
  const rangeText = oldest
    ? `${formatDate(oldest)} – ${formatDate(symptoms[0].date)}`
    : 'No symptom dates saved';
  const latestCycle = cycles[0];
  const latestTold = appointments.find((a) => a.told.trim())?.told.trim() ?? 'None saved.';

  const glance: SummaryRow[] = [
    {
      title: 'Symptoms',
      lines: [
        rangeText,
        `${symptoms.length} entries · ${stats.min} to ${stats.max} out of 10`,
        `${stats.stoppedDays} different days stopped me doing things`,
      ],
    },
    {
      title: 'Latest period',
      lines: [
        latestCycle
          ? `${formatDate(latestCycle.start)} – ${formatDate(latestCycle.end ?? latestCycle.start)} · ${latestCycle.length} days`
          : 'No period dates saved',
      ],
    },
    { title: 'Medicines and treatments tried', lines: [medicines.map((m) => m.name).join(', ') || 'None saved'] },
    { title: 'Saved records', lines: [`${appointments.length} appointments · ${history.length} health history entries`] },
    { title: 'Most recent appointment with words', lines: [`I was told: ${latestTold}`] },
  ];

  const sections: SummarySection[] = [
    {
      key: 'symptoms',
      title: 'Symptoms in my words',
      count: symptoms.length,
      rows: symptoms.map((s) => ({
        title: `${formatDate(s.date)} · ${s.score}/10${isFuture(s.date) ? UPCOMING : ''}`,
        lines: nonEmpty(s.words, s.where && `Where: ${s.where}`, s.duration && `How long: ${s.duration}`),
      })),
    },
    {
      key: 'stopped',
      title: 'What stopped me doing things',
      count: stopped.length,
      rows: stopped.map((s) => ({ title: formatDate(s.date), lines: [s.stoppedWords || 'Marked Yes'] })),
    },
    {
      key: 'cycles',
      title: 'Cycles',
      count: cycles.length,
      rows: cycles.map((c) => ({
        title: `${formatDate(c.start)} – ${formatDate(c.end ?? c.start)}${isFuture(c.start) || isFuture(c.end ?? '') ? UPCOMING : ''}`,
        lines: nonEmpty(`Period lasted ${c.length} days`, c.cycleLength ? `Cycle length ${c.cycleLength} days` : undefined),
      })),
    },
    {
      key: 'medicines',
      title: 'Medicines and treatments',
      count: medicines.length,
      rows: medicines.map((m) => ({
        title: m.name,
        lines: nonEmpty(
          `${formatRecordDate(m.started, m.startedPrecision)}${
            m.stopped ? ` – ${formatRecordDate(m.stopped, m.stoppedPrecision)}` : ' – ongoing'
          }${isFuture(m.started) || isFuture(m.stopped) ? UPCOMING : ''}`,
          m.happened,
        ),
      })),
    },
    {
      key: 'history',
      title: 'Health history',
      count: history.length,
      rows: history.map((h) => ({
        title: `${h.type} · ${formatRecordDate(h.date, h.datePrecision)}${isFuture(h.date) ? UPCOMING : ''}`,
        lines: nonEmpty(
          h.told && `I was told: ${h.told}`,
          h.done && `What was done: ${h.done}`,
          h.result && `Result or how it went: ${h.result}`,
        ),
      })),
    },
    {
      key: 'appointments',
      title: 'Appointments',
      count: appointments.length,
      rows: appointments.map((a) => ({
        title: `${formatRecordDate(a.date, a.datePrecision)} · ${a.who}${isFuture(a.date) ? UPCOMING : ''}`,
        lines: nonEmpty(
          a.why && `Why I went: ${a.why}`,
          a.told && `I was told: ${a.told}`,
          a.tests && `Tests or prescriptions: ${a.tests}`,
          a.next && `What happens next: ${a.next}`,
        ),
      })),
    },
  ];

  return { rangeText, glance, sections, notes: input.notes.trim() };
}

export function summaryToText(s: DoctorSummary): string {
  const block = (title: string, rows: SummaryRow[]) =>
    `\n\n${title}\n${rows.length ? rows.map((r) => [r.title, ...r.lines].join(' · ')).join('\n') : 'None saved.'}`;
  let out = `Atossa summary\n${s.rangeText}`;
  out += block('At a glance', s.glance);
  for (const sec of s.sections) out += block(sec.title, sec.rows);
  out += `\n\nDoctor's notes for this visit\n${s.notes || 'No notes added.'}`;
  out += '\n\nThis summary only repeats information entered in Atossa.';
  return out;
}

const esc = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

export function summaryToHtml(s: DoctorSummary): string {
  const rows = (items: SummaryRow[]) =>
    items.length
      ? items.map((r) => `<div class="row"><h3>${esc(r.title)}</h3>${r.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`).join('')
      : '<p class="muted">None saved.</p>';
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#241c17;margin:32px;font-size:15px;line-height:1.5}
  h1{font-size:28px;margin:0 0 4px} h2{font-size:19px;margin:26px 0 6px;border-top:1px solid #dad1c7;padding-top:14px}
  h3{font-size:15px;margin:10px 0 2px} p{margin:2px 0} .muted{color:#554b44} .row{page-break-inside:avoid}
  .glance{background:#dbf3ff;border-radius:8px;padding:8px 14px}
</style></head><body>
<h1>For my doctor</h1><p class="muted">${esc(s.rangeText)}</p>
<h2>At a glance</h2><div class="glance">${rows(s.glance)}</div>
${s.sections.map((sec) => `<h2>${esc(sec.title)} (${sec.count})</h2>${rows(sec.rows)}`).join('')}
<h2>Doctor's notes for this visit</h2><p>${s.notes ? esc(s.notes) : '<span class="muted">No notes added.</span>'}</p>
<p class="muted" style="margin-top:28px">This summary only repeats information entered in Atossa.</p>
</body></html>`;
}
