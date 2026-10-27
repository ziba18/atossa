// "My period" card on Today (owner, 27 Oct: the last-period question left onboarding). Empty:
// "When did your last period start?" with a day picker and "I'm not sure" (hidden for 14 days, never
// nags). Filled: "Last period started 12 Oct" + "Log a new start" + a link to the Month view.
// Descriptive only: no prediction, no day-of-cycle, no phase. A start is saved the way onboarding did it:
// a period_day record (Timeline) AND POST /cycles (Friends).
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Button, Card, DayChooser, InlineError, Txt } from '../kit';
import { colors, space } from '../../../constants/atossaUI';
import { api } from '../../../lib/api';
import { isFuture } from '../../../lib/records/dates';
import { formatDay } from '../../../lib/records/format';
import { IS_PREVIEW } from '../../../lib/preview/flag';
import { useRecordsStore } from '../../../stores/recordsStore';
import { useTimelineSession } from '../timeline/session';

const SNOOZE_KEY = 'atossa.periodCardSnoozedUntil';
const SNOOZE_DAYS = 14;

export function PeriodCard() {
  const router = useRouter();
  const periodDays = useRecordsStore((s) => s.records.period_day);
  const savePeriodDays = useRecordsStore((s) => s.savePeriodDays);
  const lastStart = useMemo(
    () => periodDays.filter((d) => d.data.isStart).map((d) => d.data.date).sort().pop() ?? null,
    [periodDays],
  );
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snoozed, setSnoozed] = useState(true); // hidden until the stored answer is read: no flash

  useEffect(() => {
    AsyncStorage.getItem(SNOOZE_KEY)
      .then((v) => setSnoozed(v != null && Number(v) > Date.now()))
      .catch(() => setSnoozed(false));
  }, []);

  if (!lastStart && snoozed) return null;

  const choose = (key: string) => {
    setError(isFuture(key) ? 'Choose today or a day before today.' : '');
    setSelected(isFuture(key) ? null : key);
  };

  const save = async () => {
    if (!selected) return;
    // Same day as the start already logged: nothing new to save (no duplicate record).
    if (selected === lastStart) { setPicking(false); setSelected(null); return; }
    setSaving(true);
    setError('');
    try {
      await savePeriodDays([{ date: selected, status: 'started', isStart: true, isEnd: false, note: '' }]);
    } catch {
      setError('We couldn’t save that date. Check your connection and try again.');
      setSaving(false);
      return;
    }
    // Friends reads /cycles; the Timeline copy above is the one that matters, so this one is best effort.
    if (!IS_PREVIEW) await api.post('/cycles', { period_start: selected }).catch(() => {});
    setSaving(false);
    setPicking(false);
    setSelected(null);
  };

  const notSure = () => {
    AsyncStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400000)).catch(() => {});
    setSnoozed(true);
  };

  return (
    <Card>
      <Txt variant="headline" accessibilityRole="header">My period</Txt>
      {lastStart && !picking ? (
        <>
          <Txt variant="body" style={{ marginTop: space.xs }}>{`Last period started ${formatDay(lastStart, 'always')}`}</Txt>
          <View style={{ marginTop: space.sm, marginLeft: -space.xs, flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xs }}>
            <Button label="Log a new start" variant="text" small onPress={() => setPicking(true)} />
            <Button
              label="Month view" accessibilityHint="Opens the Month view on the Timeline tab"
              variant="text"
              small
              onPress={() => { useTimelineSession.getState().setMode('month'); router.push('/(tabs)/timeline' as any); }}
            />
          </View>
        </>
      ) : picking ? (
        <>
          <Txt variant="secondary" color={colors.ink2} style={{ marginTop: space.xs, marginBottom: space.sm }}>
            {lastStart ? 'Choose the first day of the new period.' : 'Choose the first day. If you’re not sure, that’s fine.'}
          </Txt>
          <DayChooser value={selected ?? ''} onChange={choose} />
          <Txt variant="body" color={selected ? colors.ink : colors.ink2} style={{ marginTop: space.sm }} accessibilityLiveRegion="polite">
            {selected ? `First day: ${formatDay(selected, 'always')}` : 'No day chosen yet'}
          </Txt>
          {selected && selected === lastStart ? (
            <Txt variant="caption" color={colors.ink2} style={{ marginTop: space.xs }}>That’s the start you already logged.</Txt>
          ) : null}
          <InlineError message={error} style={{ marginTop: space.xs }} />
          <View style={{ marginTop: space.md, gap: space.xs }}>
            <Button label={saving ? 'Saving…' : 'Save'} loading={saving} disabled={!selected} onPress={save} />
            <Button label="Cancel" variant="text" disabled={saving} onPress={() => { setPicking(false); setSelected(null); setError(''); }} />
          </View>
        </>
      ) : (
        <>
          <Txt variant="body" color={colors.ink2} style={{ marginTop: space.xs }}>When did your last period start?</Txt>
          <View style={{ marginTop: space.md, gap: space.xs }}>
            <Button label="Choose the day" variant="secondary" onPress={() => setPicking(true)} />
            <Button label="I’m not sure" variant="text" onPress={notSure} />
          </View>
        </>
      )}
    </Card>
  );
}
