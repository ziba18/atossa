import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  List,
  Mic,
  Pill,
  Plus,
  Share2,
  Square,
  Stethoscope,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimelineStage2 } from "./TimelineStage2";
import { RecordsHome, RecordsList, type AppointmentRecord, type MedicineRecord, type HealthRecord as RecordsHealthRecord } from "./RecordsStage2";

type MainView = "today" | "timeline" | "doctor";
type View = MainView | "calendar" | "symptoms" | "appointments" | "medicines" | "health" | "profile";
type CaptureMode = "voice" | "text";
type CaptureTopic = "Pain today" | "Something new" | "Just a quick note" | null;
type SymptomEntry = { id: number; date: string; words: string; where: string; score: number | null; typicalScore?: number | null; worstScore?: number | null; strengthText?: "It varies" | "Not sure"; duration: string; stopped: boolean | null; stoppedWords: string; topic?: CaptureTopic; quickScore?: boolean };
type Flow = "None" | "Light" | "Medium" | "Heavy";
type DatePrecision = "exact" | "month" | "year";
type CycleEntry = {
  date: string;
  isStart: boolean;
  isEnd: boolean;
  flow: Flow;
  note: string;
};
type Cycle = { start: string; end?: string; length?: number; cycleLength?: number };
type Appointment = { id: number; date: string; datePrecision: DatePrecision; who: string; why: string; told: string; tests: string; next: string; notes: string };
type Medicine = { id: number; name: string; dose?: string; started: string; startedPrecision: DatePrecision; stopped: string; stoppedPrecision: DatePrecision; happened: string };
type HistoryType = "Told to me by a doctor" | "Test or scan" | "Procedure or surgery" | "Emergency visit";
type HealthRecord = { id: number; type: HistoryType; date: string; datePrecision: DatePrecision; told: string; done: string; result: string };

const navItems: Array<{ id: MainView; label: string; icon: typeof Sun }> = [
  { id: "today", label: "Today", icon: Sun },
  { id: "timeline", label: "Timeline", icon: List },
  { id: "doctor", label: "For my doctor", icon: FileText },
];
const bodyZones = ["Lower tummy left", "Lower tummy centre", "Lower tummy right", "Lower back", "Deep inside", "Legs"];

function noteCount(symptoms: SymptomEntry[]) {
  return symptoms.length;
}

const initialSymptoms: SymptomEntry[] = [
  { id: 1, date: "2026-09-11", words: "Squeezing pain across my lower belly. I have had pain like this for about 12 years.", where: "Across my lower belly", score: 6, duration: "On and off all day", stopped: false, stoppedWords: "" },
  { id: 2, date: "2026-09-13", words: "Sharp pain across my lower belly and down both legs.", where: "Lower belly and both legs", score: 8, duration: "Most of the morning", stopped: true, stoppedWords: "I was too sore to go to work." },
  { id: 3, date: "2026-09-15", words: "I felt very tired and had a heavy, squeezing pain low down.", where: "Lower belly", score: 6, duration: "From lunchtime until bedtime", stopped: false, stoppedWords: "" },
  { id: 4, date: "2026-09-17", words: "The pain was sharp and went down my legs. I also felt dizzy and lightheaded.", where: "Lower belly and legs", score: 9, duration: "About five hours", stopped: true, stoppedWords: "I couldn't stand up without help." },
  { id: 5, date: "2026-09-19", words: "Squeezing pain across my lower belly and I felt very tired.", where: "Across my lower belly", score: 7, duration: "On and off all day", stopped: true, stoppedWords: "I had to lie down for the afternoon." },
  { id: 6, date: "2026-09-21", words: "Sharp pain low down that was worse during my period.", where: "Lower belly", score: 8, duration: "From early morning until evening", stopped: true, stoppedWords: "I could not do the shopping or cook." },
  { id: 7, date: "2026-09-23", words: "Strong squeezing pain across my lower belly, sometimes running down my legs.", where: "Lower belly and legs", score: 8, duration: "About six hours", stopped: true, stoppedWords: "I had to leave work and go home." },
  { id: 8, date: "2026-09-24", words: "Very sharp pain across my lower belly. I feel dizzy, lightheaded and very tired.", where: "Across my lower belly and down my legs", score: 9, duration: "Since early this morning", stopped: true, stoppedWords: "I couldn't move around or stand without help." },
];

const initialCycleEntries: CycleEntry[] = [
  { date: "2026-08-21", isStart: true, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-08-22", isStart: false, isEnd: false, flow: "Heavy", note: "Had to change every hour" },
  { date: "2026-08-23", isStart: false, isEnd: false, flow: "Heavy", note: "" },
  { date: "2026-08-24", isStart: false, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-08-25", isStart: false, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-08-26", isStart: false, isEnd: true, flow: "Medium", note: "" },
  { date: "2026-07-24", isStart: true, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-07-25", isStart: false, isEnd: false, flow: "Heavy", note: "" },
  { date: "2026-07-26", isStart: false, isEnd: false, flow: "Heavy", note: "" },
  { date: "2026-07-27", isStart: false, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-07-28", isStart: false, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-07-29", isStart: false, isEnd: true, flow: "Medium", note: "" },
  { date: "2026-06-26", isStart: true, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-06-27", isStart: false, isEnd: false, flow: "Heavy", note: "" },
  { date: "2026-06-28", isStart: false, isEnd: false, flow: "Heavy", note: "" },
  { date: "2026-06-29", isStart: false, isEnd: false, flow: "Heavy", note: "" },
  { date: "2026-06-30", isStart: false, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-07-01", isStart: false, isEnd: false, flow: "Medium", note: "" },
  { date: "2026-07-02", isStart: false, isEnd: true, flow: "Medium", note: "" },
];

const initialAppointments: Appointment[] = [
  { id: 1, date: "2015-06-01", datePrecision: "month", who: "GP", why: "Very sharp pain during my periods and heavy bleeding", told: "The ultrasound showed nothing. Maybe it could be in your mind.", tests: "Ultrasound. Birth control pills and pain relievers.", next: "Come back if it continues.", notes: "" },
  { id: 2, date: "2018-05-01", datePrecision: "month", who: "Different clinic", why: "The pain was getting worse each month", told: "We didn't find anything on the scan.", tests: "Another ultrasound. Pain relievers.", next: "Return if it gets worse.", notes: "" },
  { id: 3, date: "2020-03-01", datePrecision: "month", who: "Hospital clinic", why: "Ongoing pain and heavy bleeding", told: "There are fibroids, and another problem with my bowel.", tests: "A procedure was arranged for the fibroids.", next: "Follow up after the procedure.", notes: "" },
  { id: 4, date: "2026-09-24", datePrecision: "exact", who: "Specialist clinic", why: "The pain is too much to work or move around", told: "", tests: "An examination, an ultrasound and an MRI were arranged.", next: "", notes: "I arrived crying and couldn't stand without help." },
];

const initialMedicines: Medicine[] = [
  { id: 1, name: "Birth control pills", started: "2015-06-01", startedPrecision: "month", stopped: "2016-06-01", stoppedPrecision: "month", happened: "No relief from the pain." },
  { id: 2, name: "Pain relievers", started: "2015-06-01", startedPrecision: "month", stopped: "", stoppedPrecision: "exact", happened: "Sometimes helps for a short while, often no relief." },
  { id: 3, name: "Cortisone injections at the emergency department", started: "2019-04-01", startedPrecision: "month", stopped: "2019-04-01", stoppedPrecision: "month", happened: "Gave me a little relief for a few days." },
];

const initialHealthRecords: HealthRecord[] = [
  { id: 1, type: "Test or scan", date: "2015-06-01", datePrecision: "month", told: "Nothing was found.", done: "Ultrasound", result: "I was sent home with no answers." },
  { id: 2, type: "Test or scan", date: "2018-05-01", datePrecision: "month", told: "Nothing was found.", done: "Ultrasound", result: "Still no explanation for the pain." },
  { id: 3, type: "Emergency visit", date: "2019-04-01", datePrecision: "month", told: "", done: "Cortisone injection and pain medication", result: "Some relief for a few days, then the pain came back." },
  { id: 4, type: "Told to me by a doctor", date: "2020-03-01", datePrecision: "month", told: "I have fibroids and another problem with my bowel.", done: "", result: "I was told these could be part of it." },
  { id: 5, type: "Procedure or surgery", date: "2020-06-01", datePrecision: "month", told: "", done: "A procedure for the fibroids", result: "The pain eased for a while, then it came back." },
];

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
const TODAY = "2026-09-24";

function parseDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(value: string) {
  const date = parseDate(value);
  const currentYear = parseDate(TODAY).getUTCFullYear();
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
  const year = date.getUTCFullYear() === currentYear ? "" : ` ${date.getUTCFullYear()}`;
  return `${weekday} ${date.getUTCDate()} ${monthNames[date.getUTCMonth()].slice(0, 3)}${year}`;
}

function formatDateRange(start: string, end: string) {
  const first = parseDate(start); const last = parseDate(end);
  if (start === end) return formatDate(start);
  if (first.getUTCFullYear() === last.getUTCFullYear() && first.getUTCMonth() === last.getUTCMonth()) return `${first.getUTCDate()}–${last.getUTCDate()} ${monthNames[last.getUTCMonth()].slice(0, 3)} ${last.getUTCFullYear()}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function formatRecordDate(value: string, precision: DatePrecision) {
  if (!value) return "Not entered";
  if (precision === "year") return `Around ${parseDate(value).getUTCFullYear()}`;
  if (precision === "month") { const date = parseDate(value); return `Around ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`; }
  return formatDate(value);
}

function formatRecordDateRange(start: string, startPrecision: DatePrecision, end: string, endPrecision: DatePrecision) {
  const first = formatRecordDate(start, startPrecision);
  if (!end) return `${first} – ongoing`;
  const last = formatRecordDate(end, endPrecision);
  return first === last ? first : `${first} – ${last}`;
}

function isFuture(value: string) {
  return Boolean(value && value > TODAY);
}

function inclusiveDays(start: string, end: string) {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86_400_000) + 1;
}

function deriveCycles(entries: CycleEntry[]): Cycle[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const cycles: Cycle[] = [];
  for (const entry of sorted) {
    if (entry.isStart) cycles.push({ start: entry.date });
    if (entry.isEnd) {
      const open = [...cycles].reverse().find((cycle) => !cycle.end && cycle.start <= entry.date);
      if (open) {
        open.end = entry.date;
        open.length = inclusiveDays(open.start, entry.date);
      }
    }
  }
  cycles.forEach((cycle, index) => {
    const next = cycles[index + 1];
    if (next) cycle.cycleLength = Math.round((parseDate(next.start).getTime() - parseDate(cycle.start).getTime()) / 86_400_000);
  });
  return cycles.reverse();
}

function periodSummary(entries: CycleEntry[]) {
  const latest = deriveCycles(entries)[0];
  if (!latest) return "No period dates logged";
  if (!latest.end) return `Period started: ${formatDate(latest.start)}`;
  const start = parseDate(latest.start);
  const end = parseDate(latest.end);
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `Period logged: ${start.getUTCDate()}–${end.getUTCDate()} ${monthNames[start.getUTCMonth()].slice(0, 3)}`;
  }
  return `Period logged: ${formatDateRange(latest.start, latest.end)}`;
}

export function AtossaApp() {
  const [view, setView] = useState<View>("today");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [cycleEntries, setCycleEntries] = useState<CycleEntry[]>(initialCycleEntries);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(initialHealthRecords);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(initialSymptoms);
  const [openSymptomId, setOpenSymptomId] = useState<number | null>(null);
  const [openAppointmentId, setOpenAppointmentId] = useState<number | "new" | null>(null);
  const [capture, setCapture] = useState<{ mode: CaptureMode; topic: CaptureTopic; autoStart?: boolean } | null>(null);
  const [calendarInitialDate, setCalendarInitialDate] = useState("2026-08-21");
  const [profileReturn, setProfileReturn] = useState<View>("today");
  const [periodSheet, setPeriodSheet] = useState(false);
  const [appointmentSheet, setAppointmentSheet] = useState(false);
  const [symptomReturn, setSymptomReturn] = useState<MainView>("timeline");
  const [recordView, setRecordView] = useState<"appointments" | "medicines" | "health" | null>(null);
  const [recordInitialId, setRecordInitialId] = useState<number | null>(null);

  const selectView = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const openCapture = (mode: CaptureMode, topic: CaptureTopic = null, autoStart = false, presetDate?: string) => { toast.dismiss(); setCapture({ mode, topic, autoStart, presetDate } as typeof capture & { presetDate?: string }); };
  const saveSymptom = (entry: SymptomEntry) => {
    setSymptoms((current) => [...current.filter((item) => item.id !== entry.id), entry]);
    setCapture(null);
    window.setTimeout(() => toast.success(`Saved. ${noteCount(symptoms) + 1} notes ready for your GP.`, { id: "saved-note" }), 0);
  };
  const saveQuickPain = (score: number) => {
    saveSymptom({ id: Date.now(), date: TODAY, words: "", where: "", score, typicalScore: null, worstScore: score, duration: "", stopped: null, stoppedWords: "", quickScore: true });
  };
  const addAppointment = () => {
    setOpenAppointmentId("new");
    selectView("appointments");
  };
  const title = view === "today" ? "Today" : view === "timeline" ? "Timeline" : view === "doctor" ? "For my doctor" : view === "profile" ? "Profile" : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {title && (
          <header className="mx-auto max-w-2xl px-5 pb-2 pt-7">
            {view === "profile" && <PageBack previous={profileReturn === "doctor" ? "For my doctor" : profileReturn === "timeline" ? "Timeline" : "Today"} onBack={() => selectView(profileReturn)} />}
            <div className="mt-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><h1 className="type-large-title min-w-0 truncate">{title}</h1>
            {view !== "profile" && <Button variant="ghost" size="icon" onClick={() => { setProfileReturn(view); selectView("profile"); }} className="size-11 shrink-0 rounded-full bg-muted text-[17px] font-medium text-muted-foreground" aria-label="Open Profile">S</Button>}</div>
          </header>
        )}
        <main className="mx-auto min-h-[calc(100dvh-5rem)] max-w-2xl px-5 pb-28 pt-3">
          {view === "today" && <TodayView symptoms={symptoms} appointments={appointments} onCapture={openCapture} onQuickPain={saveQuickPain} onPeriod={() => setPeriodSheet(true)} onDoctor={() => selectView("doctor")} onAppointment={() => setAppointmentSheet(true)} onSymptom={(id) => { setSymptomReturn("today"); setOpenSymptomId(id); selectView("symptoms"); }} />}
          {view === "timeline" && <TimelineStage2 symptoms={symptoms} entries={cycleEntries} appointments={appointments} medicines={medicines} onCapture={(date) => { toast.dismiss(); setCapture({ mode: "text", topic: null, presetDate: date } as typeof capture & { presetDate?: string }); }} onLogBleeding={(date) => { toast.dismiss(); setCalendarInitialDate(date ?? TODAY); setPeriodSheet(true); }} onOpenSymptom={(id) => { setSymptomReturn("timeline"); setOpenSymptomId(id); selectView("symptoms"); }} onOpenAppointment={(id) => { setRecordInitialId(id); setRecordView("appointments"); }} onOpenMedicine={(id) => { setRecordInitialId(id); setRecordView("medicines"); }} />}
          {view === "calendar" && <CalendarView key={calendarInitialDate} initialDate={calendarInitialDate} entries={cycleEntries} setEntries={setCycleEntries} onBack={() => selectView("timeline")} />}
          {view === "symptoms" && <SymptomsView symptoms={symptoms} setSymptoms={setSymptoms} initialId={openSymptomId} previous={symptomReturn === "today" ? "Today" : "Timeline"} onBack={() => { setOpenSymptomId(null); selectView(symptomReturn); }} />}
          {view === "appointments" && <AppointmentsView appointments={appointments} setAppointments={setAppointments} initialId={openAppointmentId} onBack={() => { setOpenAppointmentId(null); selectView("timeline"); }} />}
          {view === "medicines" && <MedicinesView medicines={medicines} setMedicines={setMedicines} onBack={() => selectView("timeline")} />}
          {view === "health" && <HealthHistoryView records={healthRecords} setRecords={setHealthRecords} onBack={() => selectView("timeline")} />}
          {view === "doctor" && <DoctorView notes={doctorNotes} setNotes={setDoctorNotes} symptoms={symptoms} cycles={deriveCycles(cycleEntries)} medicines={medicines} healthRecords={healthRecords} appointments={appointments} />}
          {view === "profile" && !recordView && <ProfileView medicines={medicines} appointments={appointments} healthRecords={healthRecords} previous={profileReturn === "doctor" ? "For my doctor" : profileReturn === "timeline" ? "Timeline" : "Today"} onRecords={setRecordView} onClear={() => { setSymptoms([]); setCycleEntries([]); setAppointments([]); setMedicines([]); setHealthRecords([]); }} onBack={() => selectView(profileReturn)} />}
          {view === "profile" && recordView && <RecordsList kind={recordView} initialId={recordInitialId} appointments={appointments as AppointmentRecord[]} setAppointments={(value) => setAppointments(value as Appointment[])} medicines={medicines as MedicineRecord[]} setMedicines={(value) => setMedicines(value as Medicine[])} health={healthRecords as RecordsHealthRecord[]} setHealth={(value) => setHealthRecords(value as HealthRecord[])} onBack={() => { setRecordView(null); setRecordInitialId(null); }} />}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/94 backdrop-blur-xl" aria-label="Main navigation">
          <div className="mx-auto grid max-w-2xl grid-cols-3 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id || (["calendar", "symptoms", "appointments", "medicines", "health"].includes(view) && item.id === "timeline");
              return <Button key={item.id} variant="ghost" onClick={() => selectView(item.id)} className={`type-tab h-16 min-w-0 flex-col gap-1 rounded-none px-1 ${active ? "text-primary" : "text-label"}`} aria-current={active ? "page" : undefined}><Icon className="size-6" absoluteStrokeWidth strokeWidth={1.75} /><span className="w-full whitespace-normal text-center">{item.label}</span></Button>;
            })}
          </div>
        </nav>
        {capture && <CaptureSheet mode={capture.mode} topic={capture.topic} autoStart={Boolean(capture.autoStart)} presetDate={(capture as typeof capture & { presetDate?: string }).presetDate} onClose={() => setCapture(null)} onSave={saveSymptom} />}
        {periodSheet && <PeriodSheet date={calendarInitialDate || TODAY} entries={cycleEntries} onClose={() => setPeriodSheet(false)} onSave={(entry) => { setCycleEntries((current) => [...current.filter((item) => item.date !== TODAY), entry]); setPeriodSheet(false); window.setTimeout(() => toast.success("Saved.", { id: "saved-record" }), 0); }} />}
        {appointmentSheet && <AppointmentQuickSheet onClose={() => setAppointmentSheet(false)} onSave={(appointment) => { setAppointments((current) => [...current, appointment]); setAppointmentSheet(false); window.setTimeout(() => toast.success("Saved.", { id: "saved-record" }), 0); }} />}
        <Toaster position="bottom-center" duration={3000} visibleToasts={1} expand={false} swipeDirections={["bottom"]} />
      </div>
    </TooltipProvider>
  );
}

function TodayView({ symptoms, appointments, onCapture, onQuickPain, onPeriod, onDoctor, onAppointment, onSymptom }: { symptoms: SymptomEntry[]; appointments: Appointment[]; onCapture: (mode: CaptureMode, topic?: CaptureTopic, autoStart?: boolean) => void; onQuickPain: (score: number) => void; onPeriod: () => void; onDoctor: () => void; onAppointment: () => void; onSymptom: (id: number) => void }) {
  const [quickScore, setQuickScore] = useState<number | null>(null);
  const [greeting, setGreeting] = useState("Evening");
  const latest = [...symptoms].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0];
  const upcoming = [...appointments].filter((item) => item.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date))[0];
  const notesReady = noteCount(symptoms);
  useEffect(() => { const hour = new Date().getHours(); setGreeting(hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening"); }, []);
  const starters: Array<"Pain today" | "My period" | "Something new" | "Just a quick note"> = ["Pain today", "My period", "Something new", "Just a quick note"];
  return <div className="animate-enter">
    <p className="type-body text-muted-foreground">{greeting}, Sam</p>
    <section className="hero-wash mt-2 rounded-card border border-border bg-card px-6 pb-6 pt-8 text-center shadow-hero">
      <h2 className="type-hero text-balance">What's been going on with your body?</h2>
      <Button onClick={() => onCapture("voice", null, true)} size="icon" className="mx-auto mt-6 size-[72px] rounded-full" aria-label="Tap to talk"><Mic className="size-8" absoluteStrokeWidth strokeWidth={1.75} /></Button>
      <p className="type-secondary mt-2 font-medium">Tap to talk</p>
      <Button variant="link" onClick={() => onCapture("text")} className="mt-1 h-11 text-[17px] font-medium">Type instead</Button>
    </section>
    <div className="chip-fade mt-4" aria-label="Ways to start"><div className="chip-track flex gap-2 overflow-x-auto pb-2 pr-8">{starters.map((starter) => <Button key={starter} variant="outline" onClick={() => starter === "My period" ? onPeriod() : onCapture("voice", starter)} className="h-11 shrink-0 rounded-full bg-transparent px-4 text-[15px] font-medium">{starter}</Button>)}</div></div>
    <section className="mt-6 rounded-card border border-border bg-card p-5">
      <h2 className="type-headline text-balance">Rough day? Just the number.</h2>
      <SeverityRow value={quickScore} onChange={setQuickScore} label="Pain score" />
      <Button disabled={quickScore === null} onClick={() => { if (quickScore === null) return; onQuickPain(quickScore); setQuickScore(null); }} className="mt-4 h-14 w-full">Save</Button>
    </section>
    <section className="mt-6 rounded-card border border-border bg-card p-5">
      {upcoming ? <><p className="type-headline">{upcoming.who} · {formatDate(upcoming.date)} · {notesReady} notes ready</p><Button variant="link" onClick={onDoctor} className="mt-2 h-11 px-0 text-[17px]">Preview summary</Button></> : <><p className="type-body">Got an appointment coming up? Add it and we'll get your summary ready.</p><Button variant="link" onClick={onAppointment} className="mt-2 h-11 px-0 text-[17px]">Add appointment</Button></>}
    </section>
    {latest && <Button variant="outline" onClick={() => onSymptom(latest.id)} className="tappable-card mt-6 flex items-center justify-between gap-4 text-foreground">
      <span className="min-w-0"><span className="type-caption block text-label">Your latest note · {formatDate(latest.date)}</span>{latest.words ? <span className="type-quote mt-3 block whitespace-normal">“{latest.words}”</span> : <span className="type-headline mt-3 block">Rough day{latest.score !== null ? ` · ${latest.score}/10` : ""}</span>}<span className="type-secondary mt-3 block text-muted-foreground">{latest.words ? [latest.where, latest.typicalScore != null || latest.worstScore != null ? [latest.typicalScore != null ? `${latest.typicalScore}/10 usually` : "", latest.worstScore != null ? `${latest.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ") : latest.score !== null ? `${latest.score}/10` : latest.strengthText ?? ""].filter(Boolean).join(" · ") : latest.where}</span></span><ChevronRight className="size-5 shrink-0 text-label" absoluteStrokeWidth strokeWidth={1.75} />
    </Button>}
  </div>;
}

function SeverityRow({ value, onChange, label }: { value: number | null; onChange: (value: number) => void; label: string }) {
  return <fieldset className="mt-4" role="radiogroup" aria-label={label}><div className="grid grid-cols-6 gap-2">{Array.from({ length: 6 }, (_, score) => <SeverityButton key={score} score={score} selected={value === score} onChange={onChange} />)}</div><div className="mt-2 grid grid-cols-6 gap-2">{Array.from({ length: 5 }, (_, index) => index + 6).map((score) => <SeverityButton key={score} score={score} selected={value === score} onChange={onChange} />)}</div><div className="type-caption mt-2 flex justify-between text-label"><span>0 = none</span><span>10 = worst</span></div></fieldset>;
}
function SeverityButton({ score, selected, onChange }: { score: number; selected: boolean; onChange: (score: number) => void }) { return <Button type="button" variant="outline" onClick={() => onChange(score)} className={`h-11 min-w-0 w-full rounded-full p-0 ${selected ? "selected-choice" : "bg-card"}`} role="radio" aria-checked={selected} aria-label={`${score} out of 10`}>{score}</Button>; }

type CaptureQuestion = "strength" | "where" | "when" | "impact";
const voiceSample = "It's been a stabbing pain low down on the left since Tuesday, worse when I went to the loo";

function CaptureSheet({ mode: initialMode, topic, autoStart, presetDate, onClose, onSave }: { mode: CaptureMode; topic: CaptureTopic; autoStart: boolean; presetDate?: string; onClose: () => void; onSave: (entry: SymptomEntry) => void }) {
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [stage, setStage] = useState<"capture" | "questions" | "review">("capture");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [words, setWords] = useState("");
  const [date, setDate] = useState(presetDate ?? TODAY);
  const [dateOpen, setDateOpen] = useState(false);
  const [where, setWhere] = useState("");
  const [usual, setUsual] = useState<number | null>(null);
  const [worst, setWorst] = useState<number | null>(null);
  const [strengthText, setStrengthText] = useState<"It varies" | "Not sure" | "">("");
  const [when, setWhen] = useState("");
  const [impacts, setImpacts] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<CaptureQuestion[]>([]);
  const [other, setOther] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [reviewEdit, setReviewEdit] = useState<"strength" | "where" | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const wordsRef = useRef<number | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const inferQuestions = () => {
    const lower = words.toLowerCase();
    if (!where && /\bleft\b/.test(lower)) setWhere("Lower tummy left");
    else if (!where && /\bright\b/.test(lower)) setWhere("Lower tummy right");
    else if (!where && /\bback\b/.test(lower)) setWhere("Lower back");
    if (!when && lower.includes("since tuesday")) setWhen("Since Tuesday");
    if (!impacts.length && /\bwork\b/.test(lower)) setImpacts(["Work or study"]);
    else if (!impacts.length && /\bsleep\b/.test(lower)) setImpacts(["Sleep"]);
    const result: CaptureQuestion[] = [];
    const spokenScore = lower.match(/\b(10|[0-9])\s*\/\s*10\b/); if (spokenScore) setWorst(Number(spokenScore[1])); else result.push("strength");
    if (!/(left|right|centre|center|tummy|belly|back|leg|bowel|deep inside)/.test(lower)) result.push("where");
    if (!/(period|all the time|other times|since|today|yesterday|tuesday|week|month|day)/.test(lower)) result.push("when");
    if (!/(work|study|sleep|exercise|plans|sex|nothing today|stopped|couldn't|could not)/.test(lower)) result.push("impact");
    return result.slice(0, 4);
  };
  const question = questions[questionIndex];
  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); if (wordsRef.current) window.clearInterval(wordsRef.current); }, []);
  useEffect(() => { if (mode === "text" && stage === "capture") window.setTimeout(() => textRef.current?.focus(), 0); }, [mode, stage]);
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose(); }; window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); });
  const startRecording = () => {
    setRecording(true); setSeconds(0);
    timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    const parts = voiceSample.split(" "); let index = 0;
    const prefix = words.trim(); wordsRef.current = window.setInterval(() => { setWords(`${prefix}${prefix ? " " : ""}${parts.slice(0, index + 1).join(" ")}`); index += 1; if (index >= parts.length && wordsRef.current) window.clearInterval(wordsRef.current); }, 220);
  };
  const stopRecording = () => { setRecording(false); if (timerRef.current) window.clearInterval(timerRef.current); if (wordsRef.current) window.clearInterval(wordsRef.current); };
  useEffect(() => { if (autoStart && mode === "voice") startRecording(); return () => stopRecording(); }, [autoStart]);
  const continueFromCapture = () => { if (!words.trim()) return; const next = topic === "Just a quick note" ? [] : inferQuestions(); setQuestions(next); setQuestionIndex(0); setStage(next.length ? "questions" : "review"); };
  const finishQuestion = () => { setOther(""); if (questionIndex + 1 >= questions.length) setStage("review"); else setQuestionIndex((value) => value + 1); };
  const save = () => onSave({ id: Date.now(), date, words: words.trim(), where, score: worst ?? usual, typicalScore: usual, worstScore: worst, strengthText: strengthText || undefined, duration: when, stopped: impacts.includes("Nothing today") ? false : impacts.some((item) => !["Not sure", "It varies"].includes(item)) ? true : null, stoppedWords: impacts.filter((item) => !["Nothing today", "Not sure", "It varies"].includes(item)).join(", "), topic });
  const requestClose = () => { if (confirmClose) { setConfirmClose(false); return; } if (words.trim()) setConfirmClose(true); else onClose(); };
  const prompt = "What's been going on with your body?";
  return <div className="fixed inset-0 z-50 flex items-end bg-foreground/20" role="dialog" aria-modal="true" aria-label="Add a note"><div className="capture-sheet relative h-[calc(100dvh-12px)] w-full overflow-y-auto rounded-t-sheet bg-background px-5 pb-8 shadow-sheet">
    <div className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 pb-3 pt-3 backdrop-blur"><button className="mx-auto block h-5 w-16 touch-none" onPointerDown={(event) => setDragStart(event.clientY)} onPointerUp={(event) => { if (dragStart !== null && event.clientY - dragStart > 48) requestClose(); setDragStart(null); }} aria-label="Drag down to close"><span className="mx-auto block h-1.5 w-12 rounded-full bg-border-strong" /></button><Button variant="ghost" size="icon" onClick={requestClose} className="absolute right-4 top-3 size-11 rounded-full bg-muted" aria-label="Close"><X className="size-5" absoluteStrokeWidth strokeWidth={1.75} /></Button><div className="mr-14 grid grid-cols-2 rounded-full bg-muted p-1"><Button variant="ghost" onClick={() => setMode("voice")} className={`h-11 rounded-full ${mode === "voice" ? "selected-choice" : "text-muted-foreground"}`}>Speak</Button><Button variant="ghost" onClick={() => setMode("text")} className={`h-11 rounded-full ${mode === "text" ? "selected-choice" : "text-muted-foreground"}`}>Type</Button></div></div>
    {confirmClose && <div className="mx-auto mt-4 max-w-2xl rounded-card border border-border bg-card p-5"><h2 className="type-title">Keep this note?</h2><div className="mt-4 grid gap-3"><Button onClick={save}>Save it</Button><Button variant="outline" onClick={onClose} className="h-12">Discard</Button><Button variant="link" onClick={() => setConfirmClose(false)} className="h-11">Keep editing</Button></div></div>}
    {!confirmClose && stage === "capture" && <div className="mx-auto max-w-2xl pt-5 animate-enter"><h2 className="type-title text-balance">{prompt}</h2><p className="type-secondary mt-2 text-muted-foreground">Say it however it comes. Messy is fine.</p>
      {(mode === "text" || words) && <textarea ref={textRef} value={words} onChange={(event) => setWords(event.target.value)} className={`mt-5 min-h-32 w-full rounded-input p-4 text-left text-[17px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === "voice" ? "border-0 bg-primary-soft" : "border border-border-strong bg-muted"}`} placeholder="Type what has been happening…" aria-label="Your words" />}
      {mode === "voice" ? <div className="mt-4 text-center">{recording && <><div className="waveform mx-auto flex h-12 items-center justify-center gap-1" aria-hidden="true">{Array.from({length:18},(_,i) => <span key={i} style={{animationDelay:`${i*45}ms`}} />)}</div><p className="type-secondary mt-1 font-medium tabular-nums" role="timer">0:{String(seconds).padStart(2,"0")}</p></>}<Button onClick={recording ? stopRecording : startRecording} size="icon" className="mx-auto mt-3 size-[72px] rounded-full" aria-label={recording ? "Stop recording" : "Add more by voice"}>{recording ? <Square className="size-8 fill-current" /> : <Mic className="size-8" absoluteStrokeWidth strokeWidth={1.75} />}</Button><p className="type-secondary mt-2 font-medium">{recording ? "Tap to stop" : words ? "Add more by voice" : "Tap to start"}</p></div> : null}
      <Button onClick={continueFromCapture} disabled={!words.trim() || recording} className="mt-6 h-14 w-full rounded-full text-[17px]">Continue</Button>
    </div>}
    {!confirmClose && stage === "questions" && question && <div className="mx-auto max-w-2xl pt-5 animate-enter"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><p className="type-caption text-label">A little more detail</p>{questions.length > 1 && <p className="type-caption text-label">{questionIndex + 1} of up to {questions.length}</p>}</div><QuestionContent question={question} usual={usual} worst={worst} where={where} impacts={impacts} setUsual={(value) => { setUsual(value); setStrengthText(""); }} setWorst={(value) => { setWorst(value); setStrengthText(""); }} setWhere={setWhere} setImpacts={setImpacts} when={when} setWhen={setWhen} onContinue={finishQuestion} /><label className="type-secondary mt-6 block font-medium" htmlFor="capture-other">Type or say something else</label><div className="mt-2 grid grid-cols-[minmax(0,1fr)_52px] items-start gap-2"><input id="capture-other" value={other} onChange={(event) => setOther(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && other.trim()) finishQuestion(); }} className="h-[52px] min-w-0 rounded-input border border-border-strong bg-muted px-4 text-[17px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button size="icon" variant="outline" className="size-[52px] rounded-input" aria-label="Say something else"><Mic className="size-5" absoluteStrokeWidth strokeWidth={1.75} /></Button></div>{other.trim() && <Button onClick={() => { if (question === "where") setWhere(other); if (question === "when") setWhen(other); if (question === "impact") setImpacts([other]); if (question === "strength" && ["It varies", "Not sure"].includes(other)) setStrengthText(other as "It varies" | "Not sure"); finishQuestion(); }} className="mt-3 h-12 w-full">Use these words</Button>}<div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{["Not sure", "It varies", "Skip"].map((answer) => <Button key={answer} variant="ghost" onClick={() => { if (answer !== "Skip") { if (question === "strength") { setStrengthText(answer as "It varies" | "Not sure"); setUsual(null); setWorst(null); } if (question === "where") setWhere(answer); if (question === "when") setWhen(answer); if (question === "impact") setImpacts([answer]); } finishQuestion(); }} className="h-11 px-3 text-[15px] text-muted-foreground">{answer}</Button>)}</div><Button variant="link" onClick={save} className="mt-4 h-11 px-0 text-[15px]">That's all for now</Button></div>}
    {!confirmClose && stage === "review" && <div className="mx-auto max-w-2xl pt-5 animate-enter"><h2 className="type-title text-balance">Here's what I noted.</h2><p className="type-secondary mt-1 text-muted-foreground">Tap anything to fix it.</p><div className="mt-4"><Button variant="outline" className="h-9 px-4 text-[15px]" onClick={() => setDateOpen(!dateOpen)}>{date === TODAY ? "Today" : formatDate(date)} <ChevronDown className="size-5" absoluteStrokeWidth strokeWidth={1.75} /></Button>{dateOpen && <div className="mt-2 grid grid-cols-2 gap-2 rounded-input border border-border bg-card p-3">{Array.from({length:14},(_,index) => { const next = new Date(parseDate(TODAY)); next.setUTCDate(next.getUTCDate()-index); const key=toDateKey(next.getUTCFullYear(),next.getUTCMonth(),next.getUTCDate()); return <Button key={key} variant="ghost" className={`h-11 px-2 text-[15px] ${date===key ? "selected-choice" : ""}`} onClick={() => { setDate(key); setDateOpen(false); }}>{index===0 ? "Today" : formatDate(key)}</Button>; })}</div>}</div><section className="mt-5 divide-y divide-border rounded-card border border-border bg-card px-5"><ReviewRow label="What it felt like" quote={words} value="" addLabel="words" onChange={setWords} /><ReviewChoiceRow label="Where" value={where} addLabel="where" editing={reviewEdit === "where"} onToggle={() => setReviewEdit(reviewEdit === "where" ? null : "where")}><ZoneChoices value={where} onChange={setWhere} /><Button variant="outline" className="mt-3 h-12 w-full" onClick={() => setReviewEdit(null)}>Done</Button></ReviewChoiceRow><ReviewChoiceRow label="How strong" value={[usual !== null ? `${usual}/10 usually` : "", worst !== null ? `${worst}/10 at worst` : "", strengthText].filter(Boolean).join(" · ")} addLabel="strength" editing={reviewEdit === "strength"} onToggle={() => setReviewEdit(reviewEdit === "strength" ? null : "strength")}><p className="type-secondary font-medium">Usually</p><SeverityRow value={usual} onChange={(value) => { setUsual(value); setStrengthText(""); }} label="Usually pain score" /><p className="type-secondary mt-5 font-medium">At worst</p><SeverityRow value={worst} onChange={(value) => { setWorst(value); setStrengthText(""); }} label="At worst pain score" /><div className="mt-3 flex gap-2">{["It varies", "Not sure"].map((answer) => <Button key={answer} variant="outline" onClick={() => { setStrengthText(answer as "It varies" | "Not sure"); setUsual(null); setWorst(null); }} className={`h-11 px-3 text-[15px] ${strengthText === answer ? "selected-choice" : ""}`}>{answer}</Button>)}</div><Button variant="outline" className="mt-3 h-12 w-full" onClick={() => setReviewEdit(null)}>Done</Button></ReviewChoiceRow><ReviewRow label="When" quote="" value={when} addLabel="when" onChange={setWhen} /><ReviewRow label="Got in the way of" quote="" value={impacts.join(" · ")} addLabel="impact" onChange={(value) => setImpacts(value ? [value] : [])} /></section><Button onClick={save} className="mt-6 h-14 w-full">Looks right, save</Button><Button variant="outline" onClick={() => setStage("questions")} className="mt-3 h-12 w-full">Fix something</Button><Button variant="outline" onClick={() => setStage("capture")} className="mt-3 h-12 w-full">Add more</Button></div>}
  </div></div>;
}

function QuestionContent({ question, usual, worst, where, impacts, setUsual, setWorst, setWhere, setImpacts, when, setWhen, onContinue }: { question: CaptureQuestion; usual: number | null; worst: number | null; where: string; impacts: string[]; setUsual: (value: number) => void; setWorst: (value: number) => void; setWhere: (value: string) => void; setImpacts: (value: string[]) => void; when: string; setWhen: (value: string) => void; onContinue: () => void }) {
  if (question === "strength") return <div className="mt-6"><h2 className="type-title text-balance">How strong is it — usually, and at its worst?</h2><p className="type-caption mt-2 text-label">Why I'm asking: GPs usually ask this, so it helps to have it ready.</p>{(["Usually", "At worst"] as const).map((label) => <div key={label} className="mt-5"><p className="type-secondary font-medium text-muted-foreground">{label}</p><SeverityRow value={label === "Usually" ? usual : worst} onChange={label === "Usually" ? setUsual : setWorst} label={`${label} pain score`} /></div>)}<Button onClick={onContinue} disabled={usual === null && worst === null} className="mt-5 h-14 w-full">Continue</Button></div>;
  const values = question === "where" ? bodyZones : question === "when" ? ["Only around my period", "At other times too", "All the time"] : ["Work or study", "Sleep", "Exercise", "Plans with people", "Sex", "Nothing today"];
  const title = question === "where" ? "Where do you feel it?" : question === "when" ? "Is it only around your period, at other times too, or all the time?" : "Did it get in the way of anything today?";
  const selectedValues = question === "where" ? where.split(" · ").filter(Boolean) : question === "impact" ? impacts : [when].filter(Boolean);
  const choose = (value: string) => { if (question === "when") { setWhen(value); return; } const current=selectedValues.includes(value) ? selectedValues.filter((item)=>item!==value) : [...selectedValues,value]; if (question === "where") setWhere(current.join(" · ")); else setImpacts(value === "Nothing today" ? [value] : current.filter((item)=>item!=="Nothing today")); };
  return <div className="mt-6"><h2 className="type-title text-balance">{title}</h2><p className="type-caption mt-2 text-label">Why I'm asking: GPs usually ask this, so it helps to have it ready.</p><div className="mt-5 flex flex-wrap gap-2">{values.map((value) => <Button key={value} variant="outline" onClick={() => choose(value)} className={`h-auto min-h-11 rounded-full px-4 py-2 text-[15px] font-medium whitespace-normal ${selectedValues.includes(value) ? "selected-choice" : ""}`} aria-pressed={selectedValues.includes(value)}>{value}</Button>)}</div><Button onClick={onContinue} disabled={!selectedValues.length} className="mt-5 h-14 w-full">Continue</Button></div>;
}

function ZoneChoices({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = value.split(" · ").filter(Boolean);
  return <div className="flex flex-wrap gap-2">{bodyZones.map((zone) => { const active = selected.includes(zone); return <Button key={zone} variant="outline" onClick={() => onChange((active ? selected.filter((item) => item !== zone) : [...selected, zone]).join(" · "))} className={`h-auto min-h-11 whitespace-normal px-4 py-2 text-[15px] ${active ? "selected-choice" : ""}`} aria-pressed={active}>{zone}</Button>; })}</div>;
}

function ReviewChoiceRow({ label, value, addLabel, editing, onToggle, children }: { label: string; value: string; addLabel: string; editing: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className="py-4"><Button variant="ghost" onClick={onToggle} className="h-auto min-h-11 w-full justify-between gap-4 px-0 text-left text-foreground"><span className="min-w-0"><span className="type-caption block text-label">{label}</span>{value && <span className="type-secondary mt-1 block whitespace-normal text-muted-foreground">{value}</span>}{!value && <span className="add-field-hit mt-1 inline-flex items-center"><span className="add-field-chip inline-flex items-center">+ Add {addLabel}</span></span>}</span><ChevronRight className={`size-5 shrink-0 text-label transition-transform ${editing ? "rotate-90" : ""}`} absoluteStrokeWidth strokeWidth={1.75} /></Button>{editing && <div className="mt-3">{children}</div>}</div>;
}

function ReviewRow({ label, quote, value, addLabel, onChange }: { label: string; quote: string; value: string; addLabel: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const current = quote || value;
  return <div className="py-4"><Button variant="ghost" onClick={() => setEditing(!editing)} className="h-auto min-h-11 w-full justify-between gap-4 px-0 text-left text-foreground"><span className="min-w-0"><span className="type-caption block text-label">{label}</span>{quote && <span className="type-quote mt-1 block whitespace-normal">“{quote}”</span>}{value && <span className="type-secondary mt-1 block whitespace-normal text-muted-foreground">{value}</span>}{!current && <span className="add-field-hit mt-1 inline-flex items-center"><span className="add-field-chip inline-flex items-center">+ Add {addLabel}</span></span>}</span><ChevronRight className="size-5 shrink-0 text-label" absoluteStrokeWidth strokeWidth={1.75} /></Button>{editing && <div className="mt-2"><input autoFocus value={current} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setEditing(false); }} className="h-[52px] w-full rounded-input border border-border-strong bg-muted px-4 text-[17px] outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button variant="outline" onClick={() => setEditing(false)} className="mt-2 h-12 w-full">Done</Button></div>}</div>;
}

function SheetFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { useEffect(() => { toast.dismiss(); }, []); useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]); return <div className="fixed inset-0 z-50 flex items-end bg-foreground/20" role="dialog" aria-modal="true" aria-label={title}><div className="w-full rounded-t-sheet bg-background px-5 pb-8 pt-3 shadow-sheet"><div className="mx-auto h-1.5 w-12 rounded-full bg-border-strong" /><div className="mt-2 flex items-center justify-between"><h2 className="type-title">{title}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="size-6" /></Button></div>{children}</div></div>; }

function PeriodSheet({ date = TODAY, entries, onClose, onSave }: { date?: string; entries: CycleEntry[]; onClose: () => void; onSave: (entry: CycleEntry) => void }) { const existing=entries.find((item)=>item.date===date); const [state,setState]=useState<"Started today"|"Still going"|"Ended"|null>(null); const [flow,setFlow]=useState<Flow | null>(null); return <SheetFrame title="Log bleeding" onClose={onClose}><div className="mt-5 grid gap-2">{(["Started today","Still going","Ended"] as const).map((value)=><Button key={value} variant="outline" onClick={()=>setState(value)} className={`h-12 ${state===value ? "selected-choice" : ""}`} aria-pressed={state===value}>{value}</Button>)}</div><fieldset className="mt-6"><legend className="type-headline">Flow <span className="type-secondary font-normal text-muted-foreground">(optional)</span></legend><div className="mt-3 grid grid-cols-2 gap-2">{(["None","Light","Medium","Heavy"] as Flow[]).map((value)=><Button key={value} variant="outline" onClick={()=>setFlow(value)} className={`h-12 ${flow===value ? "selected-choice" : ""}`} aria-pressed={flow===value}>{value}</Button>)}</div></fieldset><Button disabled={!state} className="mt-6 w-full" onClick={()=>{ if (!state) return; onSave({date,isStart:state==="Started today",isEnd:state==="Ended",flow:flow ?? existing?.flow ?? "None",note:existing?.note ?? ""}); }}>Save</Button></SheetFrame>; }

function AppointmentQuickSheet({ onClose, onSave }: { onClose: () => void; onSave: (appointment: Appointment) => void }) { const [who,setWho]=useState(""); const [date,setDate]=useState(TODAY); return <SheetFrame title="Add appointment" onClose={onClose}><div className="mt-5 space-y-5"><FormInput label="Who or where" value={who} onChange={setWho} /><SimpleDatePicker label="Date" value={date} onChange={setDate} /><Button disabled={!who.trim()} className="w-full" onClick={()=>onSave({...emptyAppointment(),who,date})}>Save appointment</Button></div></SheetFrame>; }

function ProfileView({ previous, onBack, medicines, appointments, healthRecords, onRecords, onClear }: { previous: string; onBack: () => void; medicines: Medicine[]; appointments: Appointment[]; healthRecords: HealthRecord[]; onRecords: (view: "medicines" | "appointments" | "health") => void; onClear: () => void }) { return <div className="animate-enter"><section className="mt-4 rounded-card border border-border bg-card p-5"><p className="type-caption text-label">Name</p><p className="type-body mt-2">Sam</p></section><RecordsHome medicines={medicines as MedicineRecord[]} appointments={appointments as AppointmentRecord[]} health={healthRecords as RecordsHealthRecord[]} onOpen={onRecords} /><p className="type-secondary mt-8 border-t border-border pt-6 text-muted-foreground">If you feel very unwell or you're worried, contact your GP, NHS 111 or 999.</p>{import.meta.env.DEV && <Button variant="link" onClick={onClear} className="mt-8 h-11 px-0 text-[15px] text-muted-foreground">Clear sample data</Button>}</div>; }

function DashboardView({ symptoms, entries, appointments, medicines, healthRecords, onOpenSymptom, onOpenCalendar, onOpenAppointment, onOpenMedicines, onOpenHealth }: { symptoms: SymptomEntry[]; entries: CycleEntry[]; appointments: Appointment[]; medicines: Medicine[]; healthRecords: HealthRecord[]; onOpenSymptom: (id: number) => void; onOpenCalendar: () => void; onOpenAppointment: (id: number | "new") => void; onOpenMedicines: () => void; onOpenHealth: () => void }) {
  const latest = deriveCycles(entries)[0];
  const previewDate = latest ? parseDate(latest.start) : new Date(Date.UTC(2026, 7, 1));
  const sortedSymptoms = [...symptoms].sort((a,b) => a.date.localeCompare(b.date));
  const scoredSymptoms = sortedSymptoms.filter((item) => item.score !== null);
  const chartStart = scoredSymptoms[0]?.date;
  const chartEnd = scoredSymptoms.at(-1)?.date;
  const chartDays: string[] = [];
  if (chartStart && chartEnd) for (let day = parseDate(chartStart); day <= parseDate(chartEnd); day.setUTCDate(day.getUTCDate() + 1)) chartDays.push(toDateKey(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const dateRange = sortedSymptoms.length ? formatDateRange(sortedSymptoms[0].date, sortedSymptoms[sortedSymptoms.length - 1].date) : "No dates saved";
  const stopped = symptoms.filter((item) => item.stopped);
  const stoppedDays = new Set(stopped.map((item) => item.date)).size;
  const weekly = [
    { label: "11–17 Sep", count: new Set(symptoms.filter((item) => item.date >= "2026-09-11" && item.date <= "2026-09-17" && item.stopped).map((item) => item.date)).size },
    { label: "18–24 Sep", count: new Set(symptoms.filter((item) => item.date >= "2026-09-18" && item.date <= "2026-09-24" && item.stopped).map((item) => item.date)).size },
  ];
  return (
    <div className="animate-enter">
      <p className="text-[17px] text-muted-foreground">A history of what you told Atossa.</p>
      <section className="mt-8 border-t border-border pt-7" aria-labelledby="pain-chart-title">
        <ChartHeading id="pain-chart-title" title="Pain over time" subtitle={`Your saved answers · ${dateRange}`} />
        <div className="mt-5 rounded-card border border-border bg-card p-4">
          <div className="type-headline flex items-center gap-2"><span className="h-3 w-3 rounded-[14px] bg-primary" /> Reported pain, 0–10</div>
          <div className="mt-5 grid h-44 items-end gap-1 border-b border-border px-1" style={{gridTemplateColumns:`repeat(${Math.max(chartDays.length,1)}, minmax(0, 1fr))`}} role="img" aria-label={`Pain scores ${scoredSymptoms.map((item) => item.score).join(", ")}`}>
            {chartDays.map((date) => { const dayEntries = scoredSymptoms.filter((item) => item.date === date); return <div key={date} className="flex h-full min-w-0 items-end justify-center gap-px">{dayEntries.map((item) => <span key={item.id} className={`severity-display-${Math.min(4,Math.floor((item.score ?? 0)/2))} relative min-w-1 flex-1 rounded-t-[14px]`} style={{ height: `${Math.max(8, (item.score ?? 0) * 10)}%` }}><span className="sr-only">{item.score}</span></span>)}</div>; })}
          </div>
          <div className="type-caption mt-3 flex justify-between text-label"><span>{chartStart ? formatDate(chartStart) : ""}</span><span>{chartEnd ? formatDate(chartEnd) : ""}</span></div>
          {scoredSymptoms.length > 0 && <p className="type-body mt-4">{scoredSymptoms.length} saved {scoredSymptoms.length === 1 ? "score" : "scores"}, from {Math.min(...scoredSymptoms.map((item) => item.score ?? 0))} to {Math.max(...scoredSymptoms.map((item) => item.score ?? 0))} out of 10.</p>}
        </div>
      </section>
      <section className="mt-8 border-t border-border pt-7" aria-labelledby="weekly-title"><ChartHeading id="weekly-title" title="Days that stopped me doing things, by week" subtitle="From your Yes and No answers" /><div className="mt-5 space-y-4 rounded-card border border-border bg-card p-4">{weekly.map((week) => <div key={week.label}><div className="type-body flex justify-between"><span className="font-semibold">{week.label}</span><span>{week.count} {week.count === 1 ? "day" : "days"}</span></div><div className="mt-2 h-6 bg-muted"><div className="h-full bg-primary" style={{width: `${week.count * 25}%`}} /></div></div>)}<p className="type-body">{stoppedDays} different saved days were marked Yes.</p></div></section>
      <section className="mt-8 border-t border-border pt-7" aria-labelledby="symptoms-title"><h2 id="symptoms-title" className="type-title">My symptoms</h2><p className="type-secondary mt-1 text-muted-foreground">{noteCount(symptoms)} saved entries</p><div className="mt-4 space-y-3">{[...symptoms].sort((a,b) => b.date.localeCompare(a.date)).map((item) => <RecordRow key={item.id} title={`${formatDate(item.date)}${item.typicalScore != null || item.worstScore != null ? ` · ${[item.typicalScore != null ? `${item.typicalScore}/10 usually` : "", item.worstScore != null ? `${item.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ")}` : item.score !== null ? ` · ${item.score}/10` : ""}${isFuture(item.date) ? " · Upcoming" : ""}`} subtitle={item.words || `Rough day${item.typicalScore != null || item.worstScore != null ? ` · ${[item.typicalScore != null ? `${item.typicalScore}/10 usually` : "", item.worstScore != null ? `${item.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ")}` : item.score !== null ? ` · ${item.score}/10` : ""}`} onClick={() => onOpenSymptom(item.id)} />)}</div></section>
      <section className="mt-8 border-t border-border pt-7" aria-labelledby="cycle-title">
        <h2 id="cycle-title" className="text-2xl font-semibold">Cycle</h2>
        <Button variant="outline" onClick={onOpenCalendar} className="tappable-card mt-4 min-h-56 flex-col items-stretch gap-4 text-foreground" aria-label={`Open calendar. ${periodSummary(entries)}`}>
          <div className="flex items-center justify-between gap-3"><span className="text-xl font-semibold">{monthNames[previewDate.getUTCMonth()]} {previewDate.getUTCFullYear()}</span><span className="flex items-center gap-1 text-base font-semibold text-primary">Open calendar <ChevronRight className="size-5" /></span></div>
          <MiniCalendar year={previewDate.getUTCFullYear()} month={previewDate.getUTCMonth()} entries={entries} />
          <span className="text-lg font-semibold">{periodSummary(entries)}</span>
        </Button>
      </section>
       <section className="mt-8 border-t border-border pt-7" aria-labelledby="appointments-title"><div className="flex items-end justify-between gap-3"><div><h2 id="appointments-title" className="type-title">Appointments</h2><p className="type-secondary mt-1 text-muted-foreground">{appointments.length} saved</p></div><Button variant="outline" onClick={() => onOpenAppointment("new")} className="h-12 px-4"><Plus className="size-5" /> Add</Button></div><div className="mt-4 space-y-3">{[...appointments].sort((a,b) => b.date.localeCompare(a.date)).map((appointment) => <Button key={appointment.id} variant="outline" onClick={() => onOpenAppointment(appointment.id)} className="tappable-card flex items-center justify-between gap-4 text-foreground"><span className="flex min-w-0 items-center gap-3"><CalendarDays className="size-5 shrink-0" absoluteStrokeWidth strokeWidth={1.75} /><span className="min-w-0"><span className="type-headline block">{formatRecordDate(appointment.date, appointment.datePrecision)} {isFuture(appointment.date) && <Upcoming />}</span><span className="type-secondary block truncate text-muted-foreground">{appointment.who}</span></span></span><ChevronRight className="size-5 shrink-0 text-label" /></Button>)}</div><Button onClick={() => onOpenAppointment("new")} className="mt-4 h-14 w-full"><Plus className="size-5" /> Add an appointment</Button></section>
       <DashboardRecordCard title="Medicines and treatments" count={medicines.length} icon={Pill} tone="coral" onOpen={onOpenMedicines} />
       <DashboardRecordCard title="Health history" count={healthRecords.length} icon={Stethoscope} tone="green" onOpen={onOpenHealth} />
    </div>
  );
}

function MiniCalendar({ year, month, entries }: { year: number; month: number; entries: CycleEntry[] }) {
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  return <div aria-hidden="true"><div className="grid grid-cols-7 text-center text-[13px] font-medium text-muted-foreground">{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: offset }).map((_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => index + 1).map((day) => { const entry = entries.find((item) => item.date === toDateKey(year, month, day)); const isLogged = entry && entry.flow !== "None"; return <span key={day} className={`relative grid aspect-square place-items-center rounded-[14px] text-[13px] font-medium ${isLogged ? "bleeding-day" : "bg-muted"}`}>{day}{(entry?.isStart || entry?.isEnd) && <span className="absolute bottom-0.5 size-1.5 rounded-full bg-card" />}</span>; })}</div></div>;
}

function CalendarView({ initialDate, entries, setEntries, onBack }: { initialDate: string; entries: CycleEntry[]; setEntries: (entries: CycleEntry[]) => void; onBack: () => void }) {
  const initial = parseDate(initialDate);
  const [monthDate, setMonthDate] = useState(new Date(Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1)));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [draft, setDraft] = useState<CycleEntry>(() => entries.find((entry) => entry.date === initialDate) ?? { date: initialDate, isStart: false, isEnd: false, flow: "None", note: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [futureKept, setFutureKept] = useState(false);
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const cycles = useMemo(() => deriveCycles(entries), [entries]);

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setDraft(entries.find((entry) => entry.date === date) ?? { date, isStart: false, isEnd: false, flow: "None", note: "" });
    setConfirmDelete(false);
    setFutureKept(false);
  };
  const saveDraft = (nextDraft = draft) => {
    setEntries([...entries.filter((entry) => entry.date !== nextDraft.date), nextDraft].sort((a, b) => a.date.localeCompare(b.date)));
    setDraft(nextDraft);
  };
  const quickStart = () => saveDraft({ ...draft, isStart: true, flow: draft.flow === "None" ? "Medium" : draft.flow });
  const quickEnd = () => {
    const openCycle = cycles.find((cycle) => !cycle.end && cycle.start <= selectedDate);
    if (!openCycle && !draft.isStart) return;
    const startDate = openCycle?.start ?? selectedDate;
    const start = parseDate(startDate);
    const end = parseDate(selectedDate);
    const range: CycleEntry[] = [];
    for (let current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
      const date = toDateKey(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
      const existing = entries.find((entry) => entry.date === date);
      range.push({
        date,
        isStart: date === startDate || Boolean(existing?.isStart),
        isEnd: date === selectedDate || Boolean(existing?.isEnd),
        flow: existing?.flow === "None" || !existing ? (date === selectedDate ? "Light" : "Medium") : existing.flow,
        note: existing?.note ?? "",
      });
    }
    const rangeDates = new Set(range.map((entry) => entry.date));
    setEntries([...entries.filter((entry) => !rangeDates.has(entry.date)), ...range].sort((a, b) => a.date.localeCompare(b.date)));
    setDraft(range[range.length - 1] ?? draft);
  };
  const deleteEntry = () => {
    setEntries(entries.filter((entry) => entry.date !== selectedDate));
    setDraft({ date: selectedDate, isStart: false, isEnd: false, flow: "None", note: "" });
    setConfirmDelete(false);
  };
  const moveMonth = (amount: number) => {
    const next = new Date(Date.UTC(year, month + amount, 1));
    setMonthDate(next);
    selectDate(toDateKey(next.getUTCFullYear(), next.getUTCMonth(), 1));
  };

  return (
    <div className="animate-enter">
      <PageBack onBack={onBack} />
      <h1 className="mt-6 text-[34px] font-semibold leading-[41px]">Calendar</h1>
      <p className="mt-2 text-lg text-muted-foreground">Choose a day to add or change what you logged.</p>
      <section className="mt-6" aria-labelledby="month-heading">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" className="size-14 shrink-0" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft className="size-7" /></Button>
          <h2 id="month-heading" className="text-center text-2xl font-semibold">{monthNames[month]} {year}</h2>
          <Button variant="outline" className="size-14 shrink-0" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight className="size-7" /></Button>
        </div>
        <div className="-mx-5 mt-5 sm:mx-0">
          <div className="grid grid-cols-7 text-center text-[15px] font-medium text-muted-foreground">{weekdays.map((day, index) => <span className="py-2" key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="grid grid-cols-7">{Array.from({ length: offset }).map((_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => index + 1).map((day) => {
            const date = toDateKey(year, month, day);
            const entry = entries.find((item) => item.date === date);
            const selected = date === selectedDate;
            return <Button key={date} variant="ghost" onClick={() => selectDate(date)} className={`relative h-14 min-w-0 rounded-[14px] p-0 text-[17px] font-semibold ${entry && entry.flow !== "None" ? "bleeding-day" : ""} ${selected ? "ring-2 ring-inset ring-primary" : ""}`} aria-label={`${formatDate(date)}${entry && entry.flow !== "None" ? ", a day you bled" : ""}${entry?.isStart ? ", start" : ""}${entry?.isEnd ? ", end" : ""}`} aria-pressed={selected}><span>{day}</span>{(entry?.isStart || entry?.isEnd) && <span className="absolute bottom-1 size-2 rounded-full bg-card" />}</Button>;
          })}</div>
        </div>
         <p className="type-body mt-3 flex items-center gap-2"><span className="bleeding-day size-5 rounded-[14px]" /> A day you bled</p>
      </section>

      <section className="mt-8 rounded-card border border-border bg-card p-4" aria-labelledby="day-heading">
        <h2 id="day-heading" className="text-2xl font-semibold">{formatDate(selectedDate)}</h2>
        {isFuture(selectedDate) && !futureKept && <div className="mt-4"><FutureDateMessage onKeep={() => setFutureKept(true)} onChange={() => { const today = parseDate(TODAY); setMonthDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))); selectDate(TODAY); }} /></div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={quickStart} className={`h-12 ${draft.isStart ? "selected-choice" : ""}`}><Check className={`size-5 ${draft.isStart ? "opacity-100" : "opacity-0"}`} /> Start of period</Button>
          <Button variant="outline" onClick={quickEnd} className={`h-12 ${draft.isEnd ? "selected-choice" : ""}`}><Check className={`size-5 ${draft.isEnd ? "opacity-100" : "opacity-0"}`} /> End of period</Button>
        </div>
        <fieldset className="mt-6"><legend className="type-headline">Flow</legend><div className="mt-3 grid grid-cols-2 gap-3">{(["None", "Light", "Medium", "Heavy"] as Flow[]).map((flow) => <Button key={flow} type="button" variant="outline" onClick={() => setDraft({ ...draft, flow })} className={`h-12 ${draft.flow === flow ? "selected-choice" : ""}`} aria-pressed={draft.flow === flow}>{flow}</Button>)}</div></fieldset>
        <label className="mt-6 block text-xl font-semibold" htmlFor="cycle-note">Short note <span className="text-base font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="cycle-note" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} maxLength={160} className="mt-3 min-h-28 w-full rounded-input border border-input bg-background p-4 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Add a note about this day…" />
        <Button onClick={() => saveDraft()} className="mt-4 h-14 w-full text-lg font-semibold"><Check className="size-6" /> Save this day</Button>
        {entries.some((entry) => entry.date === selectedDate) && !confirmDelete && <Button variant="outline" onClick={() => setConfirmDelete(true)} className="mt-3 h-14 w-full text-lg font-semibold text-destructive"><Trash2 className="size-6" /> Delete this entry</Button>}
        {confirmDelete && <div className="mt-4 rounded-input border border-destructive bg-coral-soft p-4" role="alert"><p className="text-lg font-semibold">Delete the entry for {formatDate(selectedDate)}?</p><p className="mt-1 text-base">This cannot be undone.</p><div className="mt-4 grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => setConfirmDelete(false)} className="h-14 text-lg font-semibold">Cancel</Button><Button variant="destructive" onClick={deleteEntry} className="h-14 text-lg font-semibold">Delete entry</Button></div></div>}
      </section>

      <section className="mt-8 border-t border-border pt-7" aria-labelledby="past-cycles-heading">
        <h2 id="past-cycles-heading" className="text-2xl font-semibold">Past cycles</h2>
         <div className="mt-4 space-y-3">{cycles.map((cycle) => <Button key={cycle.start} variant="outline" onClick={() => { const date = parseDate(cycle.start); setMonthDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))); selectDate(cycle.start); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="tappable-card flex items-center justify-between gap-4 text-foreground"><span><span className="type-headline block">{cycle.end ? formatDateRange(cycle.start,cycle.end) : `${formatDate(cycle.start)} – no end logged`}{(isFuture(cycle.start) || isFuture(cycle.end ?? "")) ? " · Upcoming" : ""}</span><span className="type-secondary mt-1 block">{cycle.length ? `Period lasted ${cycle.length} days` : "Period end not entered"}</span>{cycle.cycleLength && <span className="type-secondary mt-1 block">Cycle length {cycle.cycleLength} days</span>}</span><ChevronRight className="size-5 shrink-0 text-label" /></Button>)}</div>
      </section>
    </div>
  );
}

function ChartHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) { return <div><h2 id={id} className="type-title">{title}</h2><p className="type-secondary mt-1 text-muted-foreground">{subtitle}</p></div>; }
function SummaryFigure({ value, label }: { value: string; label: string; tone: "coral" | "blue" | "green" | "ivory" }) { return <div className="min-h-32 rounded-card border border-border bg-card p-4"><p className="text-3xl font-medium tabular-nums">{value}</p><p className="mt-2 text-base font-medium leading-6 text-muted-foreground">{label}</p></div>; }

function DashboardRecordCard({ title, count, icon: Icon, onOpen }: { title: string; count: number; icon: typeof Pill; tone: "coral" | "green"; onOpen: () => void }) {
  return <section className="mt-8 border-t border-border pt-7"><Button variant="outline" onClick={onOpen} className="tappable-card flex items-center justify-between gap-4 text-foreground"><span className="flex min-w-0 items-center gap-4"><Icon className="size-5 shrink-0" absoluteStrokeWidth strokeWidth={1.75} /><span><span className="type-title block whitespace-normal">{title}</span><span className="mt-2 block text-3xl font-medium tabular-nums">{count}</span><span className="type-secondary block text-muted-foreground">saved entries</span></span></span><ChevronRight className="size-5 shrink-0 text-label" /></Button></section>;
}

const emptyAppointment = (): Appointment => ({ id: Date.now(), date: TODAY, datePrecision: "exact", who: "", why: "", told: "", tests: "", next: "", notes: "" });
const emptyMedicine = (): Medicine => ({ id: Date.now(), name: "", started: TODAY, startedPrecision: "exact", stopped: "", stoppedPrecision: "exact", happened: "" });
const emptyHealthRecord = (): HealthRecord => ({ id: Date.now(), type: "Told to me by a doctor", date: TODAY, datePrecision: "exact", told: "", done: "", result: "" });

function PageBack({ onBack, previous = "Timeline" }: { onBack: () => void; previous?: string }) { return <Button variant="ghost" onClick={onBack} className="h-11 px-0 text-[17px] text-primary"><ChevronLeft className="size-5" absoluteStrokeWidth strokeWidth={1.75} /> {previous}</Button>; }
function FormInput({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { const id = `field-${label.replaceAll(" ", "-").replaceAll(":", "").toLowerCase()}`; return <label className="block text-lg font-semibold" htmlFor={id}>{label}<input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-14 w-full rounded-input border border-input bg-background px-4 text-lg font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>; }
function FormText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { const id = `field-${label.replaceAll(" ", "-").replaceAll(":", "").replaceAll("/", "-").toLowerCase()}`; return <label className="block text-lg font-semibold" htmlFor={id}>{label}<textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-28 w-full rounded-input border border-input bg-background p-4 text-lg font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>; }

function DateChoice({ label, value, precision, onChange, optional = false }: { label: string; value: string; precision: DatePrecision; onChange: (value: string, precision: DatePrecision) => void; optional?: boolean }) {
  const [futureKept, setFutureKept] = useState(false);
  const around = precision !== "exact";
  const year = value ? value.slice(0, 4) : String(parseDate(TODAY).getUTCFullYear());
  const month = value ? value.slice(0, 7) : TODAY.slice(0, 7);
  const updatePrecision = (next: DatePrecision) => {
    const nextValue = next === "exact" ? (value || TODAY) : next === "month" ? `${month}-01` : `${year}-01-01`;
    onChange(nextValue, next); setFutureKept(false);
  };
  return <fieldset><legend className="type-headline">{label}{optional && <span className="font-normal text-muted-foreground"> (optional)</span>}</legend><div className="mt-2 grid grid-cols-2 gap-3"><Button type="button" variant="outline" className={`h-12 ${!around ? "selected-choice" : ""}`} onClick={() => updatePrecision("exact")}>Exact date</Button><Button type="button" variant="outline" className={`h-12 whitespace-normal ${around ? "selected-choice" : ""}`} onClick={() => updatePrecision(precision === "exact" ? "month" : precision)}>Around this date</Button></div>{around && <div className="mt-3 grid grid-cols-2 gap-3"><Button type="button" variant="outline" className={`h-12 ${precision === "year" ? "selected-choice" : ""}`} onClick={() => updatePrecision("year")}>Year only</Button><Button type="button" variant="outline" className={`h-12 whitespace-normal ${precision === "month" ? "selected-choice" : ""}`} onClick={() => updatePrecision("month")}>Month and year</Button></div>}{precision === "exact" ? <SimpleDatePicker label={label} value={value} onChange={(next)=>{onChange(next,"exact");setFutureKept(false);}} /> : precision === "month" ? <div className="mt-3 grid grid-cols-2 gap-3"><select aria-label={`${label} month`} value={Number(month.slice(5))-1} onChange={(event)=>onChange(`${year}-${String(Number(event.target.value)+1).padStart(2,"0")}-01`,precision)} className="h-14 rounded-input border border-input bg-muted px-3">{monthNames.map((name,index)=><option key={name} value={index}>{name}</option>)}</select><select aria-label={`${label} year`} value={year} onChange={(event)=>onChange(`${event.target.value}-${month.slice(5)}-01`,precision)} className="h-14 rounded-input border border-input bg-muted px-3">{Array.from({length:201},(_,i)=>1900+i).reverse().map((item)=><option key={item}>{item}</option>)}</select></div> : <select aria-label={`${label} year`} value={year} onChange={(event)=>onChange(`${event.target.value}-01-01`,precision)} className="mt-3 h-14 w-full rounded-input border border-input bg-muted px-3">{Array.from({length:201},(_,i)=>1900+i).reverse().map((item)=><option key={item}>{item}</option>)}</select>}{optional && value && <Button type="button" variant="ghost" className="mt-2 h-12 w-full" onClick={() => onChange("", "exact")}>Clear date</Button>}{isFuture(value) && !futureKept && <div className="mt-3 rounded-card border border-border bg-card p-4"><p className="type-headline">This date is in the future. Is that right?</p><div className="mt-3 grid grid-cols-2 gap-3"><Button type="button" onClick={() => setFutureKept(true)}>Yes, keep it</Button><Button type="button" variant="outline" onClick={() => { onChange(TODAY, "exact"); setFutureKept(false); }}>Change date</Button></div></div>}</fieldset>;
}

function SimpleDatePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const date=parseDate(value || TODAY); const year=date.getUTCFullYear(); const month=date.getUTCMonth(); const day=date.getUTCDate(); const days=new Date(Date.UTC(year,month+1,0)).getUTCDate(); return <div className="mt-3 grid grid-cols-[1fr_1.4fr_1.2fr] gap-2"><select aria-label={`${label} day`} value={day} onChange={(event)=>onChange(toDateKey(year,month,Number(event.target.value)))} className="h-14 rounded-input border border-input bg-muted px-2">{Array.from({length:days},(_,index)=>index+1).map((item)=><option key={item}>{item}</option>)}</select><select aria-label={`${label} month`} value={month} onChange={(event)=>onChange(toDateKey(year,Number(event.target.value),Math.min(day,new Date(Date.UTC(year,Number(event.target.value)+1,0)).getUTCDate())))} className="h-14 rounded-input border border-input bg-muted px-2">{monthNames.map((name,index)=><option key={name} value={index}>{name.slice(0,3)}</option>)}</select><select aria-label={`${label} year`} value={year} onChange={(event)=>onChange(toDateKey(Number(event.target.value),month,Math.min(day,new Date(Date.UTC(Number(event.target.value),month+1,0)).getUTCDate())))} className="h-14 rounded-input border border-input bg-muted px-2">{Array.from({length:201},(_,i)=>1900+i).reverse().map((item)=><option key={item}>{item}</option>)}</select></div>; }

function Upcoming() { return <span className="ml-2 inline-block rounded-full bg-primary-soft px-2 py-1 align-middle text-sm font-semibold text-primary">Upcoming</span>; }
function FutureDateMessage({ onKeep, onChange }: { onKeep: () => void; onChange: () => void }) { return <div className="rounded-card border border-border bg-card p-4"><p className="text-lg font-semibold">This date is in the future. Is that right?</p><div className="mt-3 grid grid-cols-2 gap-3"><Button type="button" className="h-14 whitespace-normal text-lg font-semibold" onClick={onKeep}>Yes, keep it</Button><Button type="button" variant="outline" className="h-14 text-lg font-semibold" onClick={onChange}>Change date</Button></div></div>; }

function ConfirmDelete({ name, onCancel, onDelete }: { name: string; onCancel: () => void; onDelete: () => void }) { return <div className="rounded-input border border-destructive bg-coral-soft p-4" role="alert"><p className="text-lg font-semibold">Delete {name}?</p><p className="mt-1 text-base">This cannot be undone.</p><div className="mt-4 grid grid-cols-2 gap-3"><Button variant="outline" onClick={onCancel} className="h-14 text-lg font-semibold">Cancel</Button><Button variant="destructive" onClick={onDelete} className="h-14 text-lg font-semibold">Delete</Button></div></div>; }

function SymptomsView({ symptoms, setSymptoms, initialId, previous, onBack }: { symptoms: SymptomEntry[]; setSymptoms: (items: SymptomEntry[]) => void; initialId: number | null; previous: string; onBack: () => void }) {
  const [draft, setDraft] = useState<SymptomEntry | null>(symptoms.find((item) => item.id === initialId) ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [futureKept, setFutureKept] = useState(false);
  if (!draft) return <RecordListPage title="My symptoms" count={symptoms.length} onBack={onBack}>{[...symptoms].sort((a,b) => b.date.localeCompare(a.date)).map((item) => <RecordRow key={item.id} title={`${formatDate(item.date)}${item.typicalScore != null || item.worstScore != null ? ` · ${[item.typicalScore != null ? `${item.typicalScore}/10 usually` : "", item.worstScore != null ? `${item.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ")}` : item.score !== null ? ` · ${item.score}/10` : ""}${isFuture(item.date) ? " · Upcoming" : ""}`} subtitle={item.words || `Rough day${item.typicalScore != null || item.worstScore != null ? ` · ${[item.typicalScore != null ? `${item.typicalScore}/10 usually` : "", item.worstScore != null ? `${item.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ")}` : item.score !== null ? ` · ${item.score}/10` : ""}`} onClick={() => setDraft(item)} />)}</RecordListPage>;
  const save = () => { setSymptoms([...symptoms.filter((item) => item.id !== draft.id), draft]); setDraft(null); };
  return <div className="animate-enter"><PageBack previous={initialId !== null ? previous : "My symptoms"} onBack={() => initialId !== null ? onBack() : setDraft(null)} /><h1 className="type-large-title mt-6">Symptom entry</h1><div className="mt-7 space-y-5"><SimpleDatePicker label="Date" value={draft.date} onChange={(date) => { setDraft({...draft,date}); setFutureKept(false); }} />{isFuture(draft.date) && !futureKept && <FutureDateMessage onKeep={() => setFutureKept(true)} onChange={() => setDraft({...draft,date:TODAY})} />}{!draft.quickScore && <FormText label="My own words" value={draft.words} onChange={(words) => setDraft({...draft,words})} />}<FormInput label="Where I felt it" value={draft.where} onChange={(where) => setDraft({...draft,where})} /><fieldset><legend className="type-headline">How bad it was</legend><SeverityRow value={draft.score} onChange={(score)=>setDraft({...draft,score,strengthText:undefined})} label="How bad it was" />{draft.strengthText && <p className="type-secondary mt-2 text-muted-foreground">{draft.strengthText}</p>}</fieldset><FormInput label="How long" value={draft.duration} onChange={(duration) => setDraft({...draft,duration})} /><fieldset><legend className="type-headline">Did it stop me doing things?</legend><div className="mt-2 grid grid-cols-2 gap-3"><Button variant="outline" className={`h-12 ${draft.stopped === true ? "selected-choice" : ""}`} onClick={() => setDraft({...draft,stopped:true})}>Yes</Button><Button variant="outline" className={`h-12 ${draft.stopped === false ? "selected-choice" : ""}`} onClick={() => setDraft({...draft,stopped:false,stoppedWords:""})}>No</Button></div></fieldset>{draft.stopped && <FormText label="What it stopped me doing" value={draft.stoppedWords} onChange={(stoppedWords) => setDraft({...draft,stoppedWords})} />}<Button onClick={save} className="h-14 w-full"><Check className="size-5" absoluteStrokeWidth strokeWidth={1.75} /> Save entry</Button>{!confirmDelete && <Button variant="outline" onClick={() => setConfirmDelete(true)} className="h-12 w-full text-destructive"><Trash2 className="size-5" absoluteStrokeWidth strokeWidth={1.75} /> Delete entry</Button>}{confirmDelete && <ConfirmDelete name="this symptom entry" onCancel={() => setConfirmDelete(false)} onDelete={() => { setSymptoms(symptoms.filter((item) => item.id !== draft.id)); setDraft(null); }} />}</div></div>;
}

function AppointmentsView({ appointments, setAppointments, initialId, onBack }: { appointments: Appointment[]; setAppointments: (items: Appointment[]) => void; initialId: number | "new" | null; onBack: () => void }) {
  const initial = initialId === "new" ? emptyAppointment() : appointments.find((item) => item.id === initialId) ?? null;
  const [draft, setDraft] = useState<Appointment | null>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = () => { if (!draft || !draft.date || !draft.who.trim()) return; setAppointments([...appointments.filter((item) => item.id !== draft.id), draft]); setDraft(null); };
  if (draft) return <div className="animate-enter"><PageBack onBack={() => setDraft(null)} /><h1 className="mt-6 text-[34px] font-semibold leading-[41px]">{appointments.some((item) => item.id === draft.id) ? "Appointment" : "Add an appointment"}</h1><div className="mt-7 space-y-5"><DateChoice label="Date" value={draft.date} precision={draft.datePrecision} onChange={(date,datePrecision) => setDraft({...draft,date,datePrecision})} /><FormInput label="Who or where" required value={draft.who} onChange={(who) => setDraft({...draft,who})} /><FormText label="Why I went" value={draft.why} onChange={(why) => setDraft({...draft,why})} /><FormText label="I was told:" value={draft.told} onChange={(told) => setDraft({...draft,told})} placeholder="Write what the doctor said in your own words" /><FormText label="Tests or prescriptions:" value={draft.tests} onChange={(tests) => setDraft({...draft,tests})} /><FormText label="What happens next:" value={draft.next} onChange={(next) => setDraft({...draft,next})} /><FormText label="Notes" value={draft.notes} onChange={(notes) => setDraft({...draft,notes})} /><Button onClick={save} className="h-14 w-full text-lg font-semibold"><Check className="size-6" /> Save appointment</Button>{appointments.some((item) => item.id === draft.id) && !confirmDelete && <Button variant="outline" onClick={() => setConfirmDelete(true)} className="h-14 w-full text-lg font-semibold text-destructive"><Trash2 className="size-6" /> Delete appointment</Button>}{confirmDelete && <ConfirmDelete name="this appointment" onCancel={() => setConfirmDelete(false)} onDelete={() => { setAppointments(appointments.filter((item) => item.id !== draft.id)); setDraft(null); }} />}</div></div>;
  return <RecordListPage title="Appointments" count={appointments.length} onBack={onBack} onAdd={() => setDraft(emptyAppointment())} addLabel="Add an appointment">{[...appointments].sort((a,b) => b.date.localeCompare(a.date)).map((item) => <RecordRow key={item.id} title={`${formatRecordDate(item.date,item.datePrecision)}${isFuture(item.date) ? " · Upcoming" : ""}`} subtitle={item.who} onClick={() => setDraft(item)} />)}</RecordListPage>;
}

function MedicinesView({ medicines, setMedicines, onBack }: { medicines: Medicine[]; setMedicines: (items: Medicine[]) => void; onBack: () => void }) {
  const [draft, setDraft] = useState<Medicine | null>(null); const [confirmDelete, setConfirmDelete] = useState(false);
  const save = () => { if (!draft || !draft.name.trim() || !draft.started) return; setMedicines([...medicines.filter((item) => item.id !== draft.id), draft]); setDraft(null); };
  if (draft) return <div className="animate-enter"><PageBack onBack={() => setDraft(null)} /><h1 className="mt-6 text-[34px] font-semibold leading-[41px]">Medicine or treatment</h1><div className="mt-7 space-y-5"><FormInput label="Name" required value={draft.name} onChange={(name) => setDraft({...draft,name})} /><DateChoice label="Started" value={draft.started} precision={draft.startedPrecision} onChange={(started,startedPrecision) => setDraft({...draft,started,startedPrecision})} /><DateChoice label="Stopped" optional value={draft.stopped} precision={draft.stoppedPrecision} onChange={(stopped,stoppedPrecision) => setDraft({...draft,stopped,stoppedPrecision})} /><FormText label="What happened" value={draft.happened} onChange={(happened) => setDraft({...draft,happened})} placeholder="For example: no relief" /><Button onClick={save} className="h-14 w-full text-lg font-semibold"><Check className="size-6" /> Save entry</Button>{medicines.some((item) => item.id === draft.id) && !confirmDelete && <Button variant="outline" onClick={() => setConfirmDelete(true)} className="h-14 w-full text-lg font-semibold text-destructive"><Trash2 className="size-6" /> Delete entry</Button>}{confirmDelete && <ConfirmDelete name="this entry" onCancel={() => setConfirmDelete(false)} onDelete={() => { setMedicines(medicines.filter((item) => item.id !== draft.id)); setDraft(null); }} />}</div></div>;
  return <RecordListPage title="Medicines and treatments" count={medicines.length} onBack={onBack} onAdd={() => setDraft(emptyMedicine())} addLabel="Add medicine or treatment">{[...medicines].sort((a,b) => b.started.localeCompare(a.started)).map((item) => <RecordRow key={item.id} title={`${item.name}${isFuture(item.started) || isFuture(item.stopped) ? " · Upcoming" : ""}`} subtitle={formatRecordDateRange(item.started,item.startedPrecision,item.stopped,item.stoppedPrecision)} onClick={() => setDraft(item)} />)}</RecordListPage>;
}

function HealthHistoryView({ records, setRecords, onBack }: { records: HealthRecord[]; setRecords: (items: HealthRecord[]) => void; onBack: () => void }) {
  const [draft, setDraft] = useState<HealthRecord | null>(null); const [confirmDelete, setConfirmDelete] = useState(false);
  const types: HistoryType[] = ["Told to me by a doctor", "Test or scan", "Procedure or surgery", "Emergency visit"];
  const save = () => { if (!draft || !draft.date) return; setRecords([...records.filter((item) => item.id !== draft.id), draft]); setDraft(null); };
  if (draft) return <div className="animate-enter"><PageBack onBack={() => setDraft(null)} /><h1 className="type-large-title mt-6">Health history entry</h1><fieldset className="mt-7"><legend className="type-headline">Type</legend><div className="mt-3 grid gap-3">{types.map((type) => <Button key={type} variant="outline" onClick={() => setDraft({...draft,type})} className={`h-auto min-h-14 whitespace-normal px-4 py-3 ${draft.type === type ? "selected-choice" : ""}`} aria-pressed={draft.type === type}>{type}</Button>)}</div></fieldset><div className="mt-6 space-y-5"><DateChoice label="Date" value={draft.date} precision={draft.datePrecision} onChange={(date,datePrecision) => setDraft({...draft,date,datePrecision})} /><FormText label="I was told:" value={draft.told} onChange={(told) => setDraft({...draft,told})} placeholder="Optional" /><FormText label="What was done:" value={draft.done} onChange={(done) => setDraft({...draft,done})} placeholder="Optional" /><FormText label="Result or how it went" value={draft.result} onChange={(result) => setDraft({...draft,result})} placeholder="Write this in your own words" /><Button onClick={save} className="h-14 w-full"><Check className="size-5" /> Save entry</Button>{records.some((item) => item.id === draft.id) && !confirmDelete && <Button variant="outline" onClick={() => setConfirmDelete(true)} className="h-12 w-full text-destructive"><Trash2 className="size-5" /> Delete entry</Button>}{confirmDelete && <ConfirmDelete name="this entry" onCancel={() => setConfirmDelete(false)} onDelete={() => { setRecords(records.filter((item) => item.id !== draft.id)); setDraft(null); }} />}</div></div>;
  return <RecordListPage title="Health history" count={records.length} onBack={onBack} onAdd={() => setDraft(emptyHealthRecord())} addLabel="Add health history">{[...records].sort((a,b) => b.date.localeCompare(a.date)).map((item) => <RecordRow key={item.id} title={`${item.type}${isFuture(item.date) ? " · Upcoming" : ""}`} subtitle={formatRecordDate(item.date,item.datePrecision)} detail={[item.told && `I was told: ${item.told}`, item.done && `What was done: ${item.done}`, `Result or how it went: ${item.result}`].filter(Boolean).join(" · ")} onClick={() => setDraft(item)} />)}</RecordListPage>;
}

function RecordListPage({ title, count, onBack, onAdd, addLabel, children }: { title: string; count: number; onBack: () => void; onAdd?: () => void; addLabel?: string; children: React.ReactNode }) { return <div className="animate-enter"><PageBack onBack={onBack} /><h1 className="mt-6 text-[34px] font-semibold leading-[41px]">{title}</h1><p className="mt-2 text-lg text-muted-foreground">{count} saved {count === 1 ? "entry" : "entries"}</p>{onAdd && addLabel && <Button onClick={onAdd} className="mt-6 h-14 w-full text-lg font-semibold"><Plus className="size-6" /> {addLabel}</Button>}<div className="mt-6 space-y-3">{children}</div></div>; }
function RecordRow({ title, subtitle, detail, onClick }: { title: string; subtitle: string; detail?: string; onClick: () => void }) { return <Button variant="outline" onClick={onClick} className="tappable-card flex items-center justify-between gap-4 text-foreground"><span className="min-w-0"><span className="type-headline block whitespace-normal">{title}</span><span className="type-secondary mt-1 block whitespace-normal text-muted-foreground">{subtitle}</span>{detail && <span className="type-secondary mt-2 line-clamp-2 block whitespace-normal">{detail}</span>}</span><ChevronRight className="size-5 shrink-0 text-label" /></Button>; }

function DoctorView({ notes, setNotes, symptoms, cycles, medicines, healthRecords, appointments }: { notes: string; setNotes: (notes: string) => void; symptoms: SymptomEntry[]; cycles: Cycle[]; medicines: Medicine[]; healthRecords: HealthRecord[]; appointments: Appointment[] }) {
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ glance: true, notes: true });
  const orderedSymptoms = [...symptoms].sort((a,b) => b.date.localeCompare(a.date));
  const stoppedSymptoms = orderedSymptoms.filter((item) => item.stopped);
  const completedCycles = cycles.filter((cycle) => cycle.end && cycle.length);
  const orderedMedicines = [...medicines].sort((a,b) => b.started.localeCompare(a.started));
  const orderedHealth = [...healthRecords].sort((a,b) => b.date.localeCompare(a.date));
  const orderedAppointments = [...appointments].sort((a,b) => b.date.localeCompare(a.date));
  const firstDate = [...symptoms].sort((a,b) => a.date.localeCompare(b.date))[0]?.date;
  const rangeText = firstDate ? formatDateRange(firstDate, orderedSymptoms[0]?.date ?? firstDate) : "No symptom dates saved";
  const stoppedDays = new Set(stoppedSymptoms.map((item) => item.date)).size;
  const latestCycle = cycles[0];
  const latestCycleText = latestCycle?.end ? `${formatDateRange(latestCycle.start,latestCycle.end)} · ${latestCycle.length ?? inclusiveDays(latestCycle.start,latestCycle.end)} days` : latestCycle ? `Started ${formatDate(latestCycle.start)}` : "";
  const latestAppointment = orderedAppointments[0];
  const latestTold = latestAppointment?.told.trim() ?? "";
  const scoredSymptoms = symptoms.filter((item)=>item.worstScore != null || item.typicalScore != null || item.score !== null);
  const wordSymptoms = orderedSymptoms.filter((item)=>item.words.trim());
  const scores = scoredSymptoms.map((item) => item.worstScore ?? item.typicalScore ?? item.score ?? 0);
  const sectionText = (title: string, lines: string[]) => lines.length ? `\n\n${title}\n${lines.join("\n")}` : "";
  const shareSummary = async () => {
    const summary = `Atossa summary\n${rangeText}` + sectionText("At a glance", [`${noteCount(symptoms)} symptom entries${scores.length ? ` · ${Math.min(...scores)}–${Math.max(...scores)}/10` : ""}`, `${stoppedDays} different days stopped me doing things`, latestCycle ? `Latest period: ${latestCycleText}` : "No period dates saved", `Medicines and treatments tried: ${orderedMedicines.map((item) => item.name).join(", ") || "None saved"}`, `${appointments.length} appointments · ${healthRecords.length} health history entries`, ...(latestTold ? [`I was told: ${latestTold}`] : [])]) + sectionText("Symptoms in my words", wordSymptoms.map((item) => `${formatDate(item.date)}${item.typicalScore != null || item.worstScore != null ? ` · ${[item.typicalScore != null ? `${item.typicalScore}/10 usually` : "", item.worstScore != null ? `${item.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ")}` : item.score !== null ? ` · ${item.score}/10` : ""}${item.strengthText ? ` · ${item.strengthText}` : ""} · ${item.words}${isFuture(item.date) ? " · Upcoming" : ""}`)) + sectionText("What stopped me doing things", stoppedSymptoms.filter((item)=>item.stoppedWords).map((item) => `${formatDate(item.date)} · ${item.stoppedWords}`)) + sectionText("Cycles", completedCycles.map((cycle) => `${formatDateRange(cycle.start,cycle.end ?? cycle.start)} · Period lasted ${cycle.length} days${cycle.cycleLength ? ` · Cycle length ${cycle.cycleLength} days` : ""}${isFuture(cycle.start) || isFuture(cycle.end ?? "") ? " · Upcoming" : ""}`)) + sectionText("Medicines and treatments", orderedMedicines.map((item) => `${item.name} · ${formatRecordDate(item.started,item.startedPrecision)}${item.stopped && item.stopped !== item.started ? ` – ${formatRecordDate(item.stopped,item.stoppedPrecision)}` : item.stopped ? "" : " – ongoing"}${item.happened ? ` · ${item.happened}` : ""}${isFuture(item.started) || isFuture(item.stopped) ? " · Upcoming" : ""}`)) + sectionText("Health history", orderedHealth.map((item) => [item.type,formatRecordDate(item.date,item.datePrecision),isFuture(item.date)?"Upcoming":"",item.told?`I was told: ${item.told}`:"",item.done?`What was done: ${item.done}`:"",item.result?`Result or how it went: ${item.result}`:""].filter(Boolean).join(" · "))) + sectionText("Appointments", orderedAppointments.map((item) => [formatRecordDate(item.date,item.datePrecision),isFuture(item.date)?"Upcoming":"",item.who,item.why?`Why I went: ${item.why}`:"",item.told?`I was told: ${item.told}`:"",item.tests?`Tests or prescriptions: ${item.tests}`:"",item.next?`What happens next: ${item.next}`:""].filter(Boolean).join(" · "))) + (notes.trim() ? sectionText("Doctor's notes for this visit", [notes.trim()]) : "");
    if (navigator.share) { await navigator.share({ title: "My Atossa summary", text: summary }); return; }
    window.print();
  };
  return (
    <div className="animate-enter">
      <h2 className="type-hero text-balance">Your summary</h2><p className="type-secondary mt-2 text-muted-foreground">{rangeText}</p><p className="type-body mt-3 text-muted-foreground">Information entered in Atossa.</p>
      <DoctorSection title="At a glance" count={6} open={Boolean(openSections.glance)} onToggle={() => setOpenSections({...openSections,glance:!openSections.glance})}><div className="rounded-card border border-border bg-card p-4"><DoctorRow title="Symptoms" lines={[rangeText, `${noteCount(symptoms)} entries${scores.length ? ` · ${Math.min(...scores)} to ${Math.max(...scores)} out of 10` : ""}`, `${stoppedDays} different days stopped me doing things`]} />{latestCycle && <DoctorRow title="Latest period" lines={[latestCycleText]} />}{orderedMedicines.length > 0 && <DoctorRow title="Medicines and treatments tried" lines={[orderedMedicines.map((item) => item.name).join(", ")]} />}<DoctorRow title="Saved records" lines={[`${appointments.length} appointments · ${healthRecords.length} health history entries`]} />{latestAppointment && <DoctorRow title="Most recent appointment" lines={[`${formatRecordDate(latestAppointment.date,latestAppointment.datePrecision)}${latestTold ? ` · I was told: ${latestTold}` : ""}`]} />}</div></DoctorSection>
      <DoctorSection title="Symptoms in my words" count={wordSymptoms.length} open={Boolean(openSections.symptoms)} onToggle={() => setOpenSections({...openSections,symptoms:!openSections.symptoms})}>{wordSymptoms.map((item) => <DoctorRow key={item.id} title={`${formatDate(item.date)}${item.typicalScore != null || item.worstScore != null ? ` · ${[item.typicalScore != null ? `${item.typicalScore}/10 usually` : "", item.worstScore != null ? `${item.worstScore}/10 at worst` : ""].filter(Boolean).join(" · ")}` : item.score !== null ? ` · ${item.score}/10` : ""}${item.strengthText ? ` · ${item.strengthText}` : ""}${isFuture(item.date) ? " · Upcoming" : ""}`} lines={[item.words, ...(item.where ? [`Where: ${item.where}`] : []), ...(item.duration ? [`How long: ${item.duration}`] : [])]} />)}</DoctorSection>
      <DoctorSection title="What stopped me doing things" count={stoppedSymptoms.filter((item)=>item.stoppedWords).length} open={Boolean(openSections.stopped)} onToggle={() => setOpenSections({...openSections,stopped:!openSections.stopped})}>{stoppedSymptoms.filter((item)=>item.stoppedWords).map((item) => <DoctorRow key={item.id} title={formatDate(item.date)} lines={[item.stoppedWords]} />)}</DoctorSection>
      <DoctorSection title="Cycles" count={completedCycles.length} open={Boolean(openSections.cycles)} onToggle={() => setOpenSections({...openSections,cycles:!openSections.cycles})}>{completedCycles.map((cycle) => <DoctorRow key={cycle.start} title={`${formatDate(cycle.start)} – ${formatDate(cycle.end ?? cycle.start)}${isFuture(cycle.start) || isFuture(cycle.end ?? "") ? " · Upcoming" : ""}`} lines={[`Period lasted ${cycle.length} days`, ...(cycle.cycleLength ? [`Cycle length ${cycle.cycleLength} days`] : [])]} />)}</DoctorSection>
      <DoctorSection title="Medicines and treatments" count={orderedMedicines.length} open={Boolean(openSections.medicines)} onToggle={() => setOpenSections({...openSections,medicines:!openSections.medicines})}>{orderedMedicines.map((item) => { const start=formatRecordDate(item.started,item.startedPrecision); const end=item.stopped ? formatRecordDate(item.stopped,item.stoppedPrecision) : "ongoing"; return <DoctorRow key={item.id} title={item.name} lines={[`${start === end ? start : `${start} – ${end}`}${isFuture(item.started) || isFuture(item.stopped) ? " · Upcoming" : ""}`, item.happened]} />; })}</DoctorSection>
      <DoctorSection title="Health history" count={orderedHealth.length} open={Boolean(openSections.health)} onToggle={() => setOpenSections({...openSections,health:!openSections.health})}>{orderedHealth.map((item) => <DoctorRow key={item.id} title={`${item.type} · ${formatRecordDate(item.date,item.datePrecision)}${isFuture(item.date) ? " · Upcoming" : ""}`} lines={[...(item.told ? [`I was told: ${item.told}`] : []), ...(item.done ? [`What was done: ${item.done}`] : []), ...(item.result ? [`Result or how it went: ${item.result}`] : [])]} />)}</DoctorSection>
      <DoctorSection title="Appointments" count={orderedAppointments.length} open={Boolean(openSections.appointments)} onToggle={() => setOpenSections({...openSections,appointments:!openSections.appointments})}>{orderedAppointments.map((item) => <DoctorRow key={item.id} title={`${formatRecordDate(item.date,item.datePrecision)} · ${item.who}${isFuture(item.date) ? " · Upcoming" : ""}`} lines={[...(item.why ? [`Why I went: ${item.why}`] : []), ...(item.told ? [`I was told: ${item.told}`] : []), ...(item.tests ? [`Tests or prescriptions: ${item.tests}`] : []), ...(item.next ? [`What happens next: ${item.next}`] : [])]} />)}</DoctorSection>
      <DoctorSection title="Doctor's notes for this visit" count={notes.trim() ? 1 : 0} open={Boolean(openSections.notes)} onToggle={() => setOpenSections({...openSections,notes:!openSections.notes})}><p className="type-secondary mt-2 text-muted-foreground">These notes are included when sharing.</p><textarea className="type-body mt-4 min-h-52 w-full rounded-input border border-input bg-card p-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" value={notes} onChange={(event) => { setNotes(event.target.value); setSaved(false); }} placeholder="Type notes here…" aria-label="Doctor's notes for this visit" /><Button variant="outline" className="mt-3 h-12 w-full" onClick={() => setSaved(true)}><Check className="size-5" absoluteStrokeWidth strokeWidth={1.75} aria-hidden="true" /> Save notes</Button>{saved && <p className="type-secondary mt-3 flex items-center gap-2 font-semibold text-success" role="status"><Check className="size-5" absoluteStrokeWidth strokeWidth={1.75} /> Notes saved on this page.</p>}</DoctorSection>
      <Button onClick={shareSummary} className="mt-7 h-14 w-full"><Share2 className="size-5" aria-hidden="true" /> Share PDF</Button><p className="type-secondary mt-5 text-muted-foreground">This page only repeats information entered in Atossa and notes added during the appointment.</p><p className="type-secondary mt-7 border-t border-border pt-5 text-muted-foreground">If you feel very unwell or you're worried, contact your GP, NHS 111 or 999.</p>
    </div>
  );
}

function DoctorSection({ title, count, open, onToggle, children }: { title: string; count: number; open: boolean; onToggle: () => void; children: React.ReactNode }) { return <section className="doctor-section mt-7 border-t border-border pt-4"><Button variant="ghost" className="h-auto min-h-14 w-full justify-between gap-3 px-1 text-left text-foreground" onClick={onToggle} aria-expanded={open}><span className="type-title whitespace-normal">{title} <span className="type-body text-muted-foreground">({count})</span></span><ChevronDown className={`size-6 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} absoluteStrokeWidth strokeWidth={1.75} /></Button><div className={`${open ? "block" : "hidden"} doctor-section-content mt-3 divide-y divide-border`}>{children}</div></section>; }
function DoctorRow({ title, lines }: { title: string; lines: string[] }) { return <article className="py-4"><h3 className="type-headline">{title}</h3>{lines.map((line,index) => <p key={`${line}-${index}`} className="type-secondary mt-1">{line}</p>)}</article>; }
