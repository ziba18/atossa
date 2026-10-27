// Shared "Log bleeding" sheet — opened from Today and from Timeline (Month view + DaySheet).
// Status is required and nothing is pre-selected for a new day; flow is optional with no
// default. Spotting is its own status (never inferred from flow). Saves one period_day per date.
import React, { useEffect, useState } from 'react';
import { urgentSignpost } from '../../lib/urgentWording';
import { View } from 'react-native';
import { Button, Card, ChipGroup, DatePill, DayChooser, FieldLabel, InlineError, Sheet, TextField, Txt, showToast } from './kit';
import { colors, space } from '../../constants/atossaUI';
import { haptics } from '../../lib/haptics';
import { todayKey } from '../../lib/records/dates';
import { bleedingStatus, formatRelativeDay } from '../../lib/records/format';
import { useRecordsStore } from '../../stores/recordsStore';
import type { BleedingStatus, Flow, PeriodDayData } from '../../types/records';

const FLOWS: Flow[] = ['None', 'Light', 'Medium', 'Heavy'];

export function LogBleedingSheet({
  visible, onClose, date: initialDate, onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  /** Preset day (e.g. the DaySheet's date). Defaults to today. */
  date?: string;
  onSaved?: (day: PeriodDayData) => void;
}) {
  const savePeriodDays = useRecordsStore((s) => s.savePeriodDays);
  const periodDays = useRecordsStore((s) => s.records.period_day);
  const [date, setDate] = useState(initialDate ?? todayKey());
  const [choosingDate, setChoosingDate] = useState(false);
  const [status, setStatus] = useState<BleedingStatus | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fresh state each time it opens; an already-logged day opens with its saved values.
  const loadDay = (key: string) => {
    const existing = periodDays.find((r) => r.data.date === key)?.data;
    const st = existing ? bleedingStatus(existing) : null;
    setStatus(st);
    // Spotting never carries a flow (review 2, N10) — an old "Spotting · Medium" opens without it.
    setFlow(st === 'spotting' ? null : existing?.flow ?? null);
    setNote(existing?.note ?? '');
  };
  useEffect(() => {
    if (!visible) return;
    const key = initialDate ?? todayKey();
    setDate(key);
    setChoosingDate(false);
    setError('');
    loadDay(key);
  }, [visible, initialDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isToday = date === todayKey();
  const statusOptions = [
    { value: 'started', label: isToday ? 'Started today' : 'Started this day' },
    { value: 'ongoing', label: 'Still going' },
    { value: 'ended', label: 'Ended' },
    { value: 'spotting', label: 'Spotting' },
  ];

  const save = async () => {
    if (!status) return;
    const day: PeriodDayData = {
      date,
      status,
      isStart: status === 'started',
      isEnd: status === 'ended',
      ...(flow && status !== 'spotting' ? { flow } : {}),
      note: note.trim(),
    };
    setSaving(true);
    setError('');
    try {
      await savePeriodDays([day]);
      haptics.success();
      onSaved?.(day);
      onClose();
      const what = status === 'spotting' ? 'Spotting' : 'Bleeding';
      showToast(`Saved. ${what} logged for ${isToday ? 'today' : formatRelativeDay(date)}.`);
    } catch {
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Log bleeding"
      titleIcon={{ name: 'droplet', color: colors.clay }}
      header={<DatePill value={date} onPress={() => setChoosingDate((v) => !v)} />}
      footer={<Button label="Save" onPress={save} disabled={!status} loading={saving} />}
    >
      <View style={{ gap: space.xxl }}>
        {choosingDate ? (
          <DayChooser
            value={date}
            onChange={(k) => { setDate(k); loadDay(k); setChoosingDate(false); }}
          />
        ) : null}
        <View>
          <FieldLabel label="What’s happening?" />
          <ChipGroup
            accessibilityLabel="Bleeding status"
            options={statusOptions}
            value={status}
            onChange={(v) => {
              const next = v as BleedingStatus | null;
              setStatus(next);
              // Spotting is not a flow level: drop any flow chosen for another status (N10).
              if (next === 'spotting') setFlow(null);
            }}
          />
        </View>
        {status === 'spotting' ? null : (
        <View>
          <FieldLabel label="Flow" optional />
          <ChipGroup
            accessibilityLabel="Flow"
            options={FLOWS}
            value={flow}
            allowDeselect
            onChange={(v) => setFlow(v as Flow | null)}
          />
        </View>
        )}
        {urgentSignpost(note) ? (
          <Card tone="sunken">
            <Txt accessibilityRole="alert">{urgentSignpost(note)}</Txt>
          </Card>
        ) : null}
        <TextField
          label="Anything to note?"
          optional
          value={note}
          onChangeText={setNote}
          placeholder="In your own words"
          multiline
          maxLength={500}
        />
        <InlineError message={error} />
      </View>
    </Sheet>
  );
}
