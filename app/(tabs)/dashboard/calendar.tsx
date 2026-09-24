import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { UI } from '../../../constants/atossaUI';
import {
  BackButton, BigButton, Card, ConfirmDelete, FutureDateMessage, InlineError, PageTitle, RecordRow, Screen,
  Section, SectionHeading, TextField, Txt,
} from '../../../components/atossa/kit';
import { MonthGrid } from '../../../components/atossa/Calendar';
import { useRecordsStore } from '../../../stores/recordsStore';
import { deriveCycles } from '../../../lib/records/summary';
import {
  MONTH_NAMES, addDays, diffDays, formatDate, isFuture, parseKey, todayKey, toKey,
} from '../../../lib/records/dates';
import type { Flow, PeriodDayData } from '../../../types/records';

const C = UI.colors;
const FLOWS: Flow[] = ['None', 'Light', 'Medium', 'Heavy'];
const blankDay = (date: string): PeriodDayData => ({ date, isStart: false, isEnd: false, flow: 'None', note: '' });

export default function CalendarScreen() {
  const router = useRouter();
  const { records, savePeriodDays, deletePeriodDay } = useRecordsStore();
  const days = useMemo(() => records.period_day.map((r) => r.data), [records.period_day]);
  const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const cycles = useMemo(() => deriveCycles(days), [days]);

  const today = todayKey();
  const startParts = parseKey(cycles[0]?.start ?? today);
  const [month, setMonth] = useState({ y: startParts.y, m0: startParts.m0 });
  const initialDate = cycles[0]?.start ?? today;
  const [selected, setSelected] = useState(initialDate);
  const [draft, setDraft] = useState<PeriodDayData>(dayMap.get(initialDate) ?? blankDay(initialDate));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [futureKept, setFutureKept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectDate = (date: string) => {
    setSelected(date);
    setDraft(dayMap.get(date) ?? blankDay(date));
    setConfirmDelete(false);
    setFutureKept(false);
    setError('');
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch { setError("That couldn't be saved. Check your connection and try again."); } finally { setBusy(false); }
  };

  const saveDraft = (next: PeriodDayData = draft) => run(async () => { await savePeriodDays([next]); setDraft(next); });

  const quickStart = () => saveDraft({ ...draft, isStart: true, flow: draft.flow === 'None' ? 'Medium' : draft.flow });

  const quickEnd = () => {
    const open = cycles.find((c) => !c.end && c.start <= selected);
    if (!open && !draft.isStart) {
      setError('Choose the day your period started first, then tap "Start of period".');
      return;
    }
    const startDate = open?.start ?? selected;
    const range: PeriodDayData[] = [];
    const span = diffDays(startDate, selected);
    for (let i = 0; i <= span; i++) {
      const date = addDays(startDate, i);
      const existing = dayMap.get(date);
      range.push({
        date,
        isStart: date === startDate || Boolean(existing?.isStart),
        isEnd: date === selected || Boolean(existing?.isEnd),
        flow: !existing || existing.flow === 'None' ? (date === selected ? 'Light' : 'Medium') : existing.flow,
        note: existing?.note ?? '',
      });
    }
    run(async () => { await savePeriodDays(range); setDraft(range[range.length - 1] ?? draft); });
  };

  const removeDay = () => run(async () => {
    await deletePeriodDay(selected);
    setDraft(blankDay(selected));
    setConfirmDelete(false);
  });

  const moveMonth = (delta: number) => {
    const d = new Date(Date.UTC(month.y, month.m0 + delta, 1));
    setMonth({ y: d.getUTCFullYear(), m0: d.getUTCMonth() });
    selectDate(toKey(d.getUTCFullYear(), d.getUTCMonth(), 1));
  };

  const needsFutureOk = isFuture(selected) && !futureKept;
  const hasEntry = dayMap.has(selected);

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <View style={{ marginTop: 20 }}>
        <PageTitle title="Calendar" subtitle="Choose a day to add or change what you logged." />
      </View>

      <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BigButton label="‹" accessibilityLabel="Previous month" variant="outline" onPress={() => moveMonth(-1)} style={{ width: 64 }} />
        <Txt variant="h2" style={{ flex: 1, textAlign: 'center' }}>{MONTH_NAMES[month.m0]} {month.y}</Txt>
        <BigButton label="›" accessibilityLabel="Next month" variant="outline" onPress={() => moveMonth(1)} style={{ width: 64 }} />
      </View>
      <View style={{ marginTop: 12 }}>
        <MonthGrid
          year={month.y}
          month0={month.m0}
          selected={selected}
          onSelect={selectDate}
          cellState={(key) => {
            const d = dayMap.get(key);
            return { bleeding: !!d && d.flow !== 'None', start: d?.isStart, end: d?.isEnd };
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: C.bleeding }} />
        <Txt variant="body">A day you bled</Txt>
      </View>

      <Card style={{ marginTop: 28, gap: 16 }}>
        <Txt variant="h2">{formatDate(selected)}</Txt>
        {needsFutureOk ? <FutureDateMessage onKeep={() => setFutureKept(true)} onChange={() => { const t = parseKey(today); setMonth({ y: t.y, m0: t.m0 }); selectDate(today); }} /> : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <BigButton label="Start of period" icon={draft.isStart ? 'check' : undefined} selected={draft.isStart} variant="outline" disabled={busy || needsFutureOk} onPress={quickStart} style={{ flex: 1 }} />
          <BigButton label="End of period" icon={draft.isEnd ? 'check' : undefined} selected={draft.isEnd} variant="outline" disabled={busy || needsFutureOk} onPress={quickEnd} style={{ flex: 1 }} />
        </View>
        <View>
          <Txt variant="h3">Flow</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            {FLOWS.map((f) => (
              <BigButton key={f} label={f} variant="outline" selected={draft.flow === f} onPress={() => setDraft({ ...draft, flow: f })} style={{ width: '47.5%' }} />
            ))}
          </View>
        </View>
        <TextField label="Short note (optional)" value={draft.note} onChangeText={(note) => setDraft({ ...draft, note })} maxLength={160} multiline placeholder="Add a note about this day…" />
        <InlineError message={error} />
        <BigButton label={busy ? 'Saving…' : 'Save this day'} icon="check" disabled={busy || needsFutureOk} onPress={() => saveDraft()} />
        {hasEntry && !confirmDelete ? <BigButton label="Delete this entry" icon="trash" variant="outline" textColor={C.destructive} onPress={() => setConfirmDelete(true)} /> : null}
        {confirmDelete ? <ConfirmDelete name={`the entry for ${formatDate(selected)}`} onCancel={() => setConfirmDelete(false)} onDelete={removeDay} /> : null}
      </Card>

      <Section>
        <SectionHeading title="Past cycles" />
        <View style={{ gap: 12 }}>
          {cycles.length === 0 ? <Txt variant="body" color={C.mutedForeground}>No periods logged yet. Choose the first day of your period above and tap “Start of period”.</Txt> : null}
          {cycles.map((c) => (
            <RecordRow
              key={c.start}
              title={`${formatDate(c.start, true)}${c.end ? ` – ${formatDate(c.end, true)}` : ' – no end logged'}`}
              subtitle={[c.length ? `Period lasted ${c.length} days` : 'Period end not entered', c.cycleLength ? `Cycle length ${c.cycleLength} days` : ''].filter(Boolean).join(' · ')}
              upcoming={isFuture(c.start) || isFuture(c.end ?? '')}
              onPress={() => {
                const p = parseKey(c.start);
                setMonth({ y: p.y, m0: p.m0 });
                selectDate(c.start);
              }}
            />
          ))}
        </View>
      </Section>
    </Screen>
  );
}
