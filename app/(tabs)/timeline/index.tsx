// Timeline tab: List (filterable feed grouped by week) · Month (calendar + DaySheet).
import { usePageTitle } from '../../../lib/usePageTitle';
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AddButton, Button, ChipGroup, EmptyState, FadeIn, HeaderAvatar, InlineError, SkeletonCards, ScreenLarge, SegmentedControl, Txt,
} from '../../../components/atossa/kit';
import { LogBleedingSheet } from '../../../components/atossa/LogBleedingSheet';
import { DaySheet } from '../../../components/atossa/timeline/DaySheet';
import { GhostEntry } from '../../../components/atossa/timeline/GhostEntry';
import { PatternsView } from '../../../components/atossa/timeline/PatternsView';
import { RecentStrip } from '../../../components/atossa/timeline/RecentStrip';
import { EntryCard } from '../../../components/atossa/timeline/EntryCard';
import { MonthCalendar, type DayMark } from '../../../components/atossa/timeline/MonthCalendar';
import {
  EMPTY_FILTER_TEXT, buildFeed, filterFeed, groupFeed, itemsOnDay, mergeBleedingRuns, type FeedItem, type ListItem,
} from '../../../components/atossa/timeline/feed';
import {
  AFTER_SHEET_MS, bleedingHref, entryHref, periodHref, recordHref,
} from '../../../components/atossa/timeline/navigation';
import { TIMELINE_FILTERS, useTimelineSession, type TimelineFilter, type TimelineMode } from '../../../components/atossa/timeline/session';
import { colors, space } from '../../../constants/atossaUI';
import { openCapture } from '../../../lib/captureStore';
import { parseKey, todayKey } from '../../../lib/records/dates';
import { bleedingStatus, noteCount, worstOf } from '../../../lib/records/format';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';

const MODES: { value: TimelineMode; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'month', label: 'Month' },
  { value: 'patterns', label: 'Patterns' },
];

const dayWord = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

export default function TimelineScreen() {
  const router = useRouter();
  usePageTitle('Timeline');
  const { mode, setMode, filter, setFilter } = useTimelineSession();
  const symptom = useRecordsStore((s) => s.records.symptom);
  const loadError = useRecordsStore((s) => s.error);
  const loadedFor = useRecordsStore((s) => s.loadedFor);
  const load = useRecordsStore((s) => s.load);
  const loading = useRecordsStore((s) => s.loading);
  const userId = useAuthStore((s) => s.user?.id);
  const periodDay = useRecordsStore((s) => s.records.period_day);
  const appointment = useRecordsStore((s) => s.records.appointment);
  const medicine = useRecordsStore((s) => s.records.medicine);

  const feed = useMemo(
    () => buildFeed({ symptom, period_day: periodDay, appointment, medicine }),
    [symptom, periodDay, appointment, medicine],
  );

  const [month, setMonth] = useState(() => {
    const t = parseKey(todayKey());
    return { y: t.y, m0: t.m0 };
  });
  const [day, setDay] = useState<string | null>(null);
  const [bleedingFor, setBleedingFor] = useState<{ date?: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const later = (fn: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, AFTER_SHEET_MS);
  };
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const open = (item: ListItem) => {
    switch (item.kind) {
      case 'symptom': router.push(entryHref(item.rec.id) as any); break;
      case 'bleeding': router.push(bleedingHref(item.date) as any); break;
      case 'bleedingRun': router.push(periodHref(item.start) as any); break;
      case 'appointment': router.push(recordHref('appointments', item.rec.id) as any); break;
      case 'medicine': router.push(recordHref('medicines', item.rec.id) as any); break;
    }
  };

  // A quiet plum glyph, not a filled disc (V16). Hidden while the empty List shows its own
  // "Add a note" button, so there is only one primary for one action.
  const waiting = loading && !loadedFor;
  const emptyList = (mode === 'list' || mode === 'patterns') && feed.length === 0 && !waiting;
  const header = (
    <>
      {emptyList ? null : <AddButton label="Add a note" onPress={() => openCapture()} />}
      <HeaderAvatar />
    </>
  );

  return (
    <ScreenLarge title="Timeline" right={header} contentStyle={emptyList ? { flexGrow: 1 } : undefined}>
      {loadError && !loadedFor ? (
        <InlineError message={loadError} onRetry={userId ? () => load(userId) : undefined} style={{ marginBottom: space.md }} />
      ) : null}
      <SegmentedControl accessibilityLabel="Timeline view" options={MODES} value={mode} onChange={setMode} />
      {waiting ? (
        <View style={{ marginTop: space.lg }}><SkeletonCards count={3} label="Loading your timeline" /></View>
      ) : mode === 'list' ? (
        <ListView feed={feed} symptoms={symptom} filter={filter} setFilter={setFilter} onOpen={open} />
      ) : mode === 'patterns' ? (
        <PatternsView onOpen={(f) => { setFilter(f); setMode('list'); }} />
      ) : (
        <MonthView
          feed={feed}
          symptomDates={symptom}
          periodDays={periodDay}
          month={month}
          setMonth={setMonth}
          onDayPress={setDay}
          onLogPeriod={() => setBleedingFor({})}
        />
      )}

      <DaySheet
        day={day}
        items={day ? itemsOnDay(feed, day) : []}
        onClose={() => setDay(null)}
        onOpenItem={(item) => { setDay(null); later(() => open(item)); }}
        onAddNote={(d) => { setDay(null); later(() => openCapture({ date: d })); }}
        onLogBleeding={(d) => { setDay(null); later(() => setBleedingFor({ date: d })); }}
      />
      <LogBleedingSheet
        visible={bleedingFor != null}
        date={bleedingFor?.date}
        onClose={() => setBleedingFor(null)}
      />
    </ScreenLarge>
  );
}

// ---- List -----------------------------------------------------------------------------------

function ListView({
  feed, symptoms, filter, setFilter, onOpen,
}: {
  feed: FeedItem[];
  symptoms: ReturnType<typeof useRecordsStore.getState>['records']['symptom'];
  filter: (typeof TIMELINE_FILTERS)[number];
  setFilter: (f: (typeof TIMELINE_FILTERS)[number]) => void;
  onOpen: (item: ListItem) => void;
}) {
  const groups = useMemo(() => groupFeed(mergeBleedingRuns(filterFeed(feed, filter))), [feed, filter]);

  if (feed.length === 0) {
    return (
      <EmptyState
        fill
        illustration={<GhostEntry />}
        icon="list"
        message="Nothing here yet. Your notes will line up here by date."
        action={{ label: 'Add a note', onPress: () => openCapture() }}
      />
    );
  }

  return (
    <View>
      {/* Filters lead so the chips never move when the strip comes and goes. */}
      <View style={{ marginTop: space.lg }}>
        <ChipGroup
          scroll
          bleed
          accessibilityLabel="Show"
          options={TIMELINE_FILTERS}
          value={filter}
          onChange={(v) => { if (v) setFilter(v as TimelineFilter); }}
        />
      </View>
      {/* The strip counts symptom notes, so it only shows where those are on the list. */}
      {filter === 'All' || filter === 'Symptoms' ? (
        <RecentStrip symptoms={symptoms} />
      ) : null}
      {groups.length === 0 && filter !== 'All' ? (
        <Txt variant="secondary" style={{ textAlign: 'center', marginTop: space.xxxl }}>
          {EMPTY_FILTER_TEXT[filter]}
        </Txt>
      ) : (
        groups.map((g, i) => (
          // Week header: 15/600 ink2 (groupLabel) — quieter than the card titles it groups.
          // 32 above (24 under the filters for the first), 8 below, 12 between cards.
          <View key={g.key} style={{ marginTop: i === 0 ? space.xl : space.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
              <Txt variant="groupLabel" accessibilityRole="header">{g.label}</Txt>
              {/* Hairline rule runs out from the label so each week reads as its own block. */}
              <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            </View>
            <View style={{ gap: space.sm }}>
              {g.items.map((item, j) => (
                <FadeIn key={item.key} index={i === 0 ? j : 0}>
                  <EntryCard item={item} onPress={() => onOpen(item)} />
                </FadeIn>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ---- Month ----------------------------------------------------------------------------------

function MonthView({
  feed, symptomDates, periodDays, month, setMonth, onDayPress, onLogPeriod,
}: {
  feed: FeedItem[];
  symptomDates: ReturnType<typeof useRecordsStore.getState>['records']['symptom'];
  periodDays: ReturnType<typeof useRecordsStore.getState>['records']['period_day'];
  month: { y: number; m0: number };
  setMonth: (m: { y: number; m0: number }) => void;
  onDayPress: (key: string) => void;
  onLogPeriod: () => void;
}) {
  const marks = useMemo(() => {
    const out: Record<string, DayMark> = {};
    const get = (k: string) => (out[k] ??= { notes: 0, hasEntries: false });
    for (const item of feed) if (item.precision === 'exact') get(item.date).hasEntries = true;
    const byDay = new Map<string, typeof symptomDates>();
    for (const s of symptomDates) {
      const list = byDay.get(s.data.date) ?? [];
      list.push(s);
      byDay.set(s.data.date, list);
    }
    for (const [k, list] of byDay) {
      get(k).notes = noteCount(list);
      const worsts = list.map((r) => worstOf(r.data)).filter((n): n is number => n != null);
      if (worsts.length) get(k).worst = Math.max(...worsts);
    }
    for (const p of periodDays) {
      const d = p.data;
      get(d.date).bleeding = bleedingStatus(d) === 'spotting' ? 'spotting' : d.flow === 'None' ? 'none-flow' : 'bleeding';
    }
    return out;
  }, [feed, symptomDates, periodDays]);

  const prefix = `${month.y}-${String(month.m0 + 1).padStart(2, '0')}-`;
  let bleedingDays = 0;
  let spottingDays = 0;
  let noteDays = 0;
  for (const [k, m] of Object.entries(marks)) {
    if (!k.startsWith(prefix)) continue;
    if (m.notes > 0) noteDays++;
    if (m.bleeding === 'bleeding') bleedingDays++;
    else if (m.bleeding === 'spotting') spottingDays++;
  }
  const summary = [
    noteDays ? `Notes on ${dayWord(noteDays)} this month.` : '',
    bleedingDays ? `Bleeding logged on ${dayWord(bleedingDays)}.` : '',
    spottingDays ? `Spotting logged on ${dayWord(spottingDays)}.` : '',
  ].filter(Boolean).join(' ');

  const shift = (n: number) => {
    const t = month.m0 + n;
    setMonth({ y: month.y + Math.floor(t / 12), m0: ((t % 12) + 12) % 12 });
  };

  return (
    <View style={{ marginTop: space.lg, gap: space.lg }}>
      <Button variant="secondary" label="Log a period" onPress={onLogPeriod} />
      <MonthCalendar
        year={month.y}
        month0={month.m0}
        marks={marks}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onDayPress={onDayPress}
      />
      {summary ? <Txt variant="secondary" color={colors.ink2}>{summary}</Txt> : null}
    </View>
  );
}
