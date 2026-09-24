import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton, InlineError, PageTitle, Screen, StepProgress, Txt } from '../../../components/atossa/kit';
import { MonthGrid } from '../../../components/atossa/Calendar';
import { api } from '../../../lib/api';
import { useRecordsStore } from '../../../stores/recordsStore';
import { MONTH_NAMES, formatDate, isFuture, parseKey, todayKey } from '../../../lib/records/dates';

export default function OnboardingLastPeriod() {
  const router = useRouter();
  const savePeriodDays = useRecordsStore((s) => s.savePeriodDays);
  const today = parseKey(todayKey());
  const [month, setMonth] = useState({ y: today.y, m0: today.m0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const atCurrentMonth = month.y === today.y && month.m0 === today.m0;
  const moveMonth = (delta: number) => {
    const d = new Date(Date.UTC(month.y, month.m0 + delta, 1));
    setMonth({ y: d.getUTCFullYear(), m0: d.getUTCMonth() });
  };

  const choose = (key: string) => {
    setError(isFuture(key) ? 'Choose today or a day before today.' : '');
    setSelected(isFuture(key) ? null : key);
  };

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      // The calendar in Dashboard reads period days; Friends reads /cycles. Save to both.
      await Promise.all([
        savePeriodDays([{ date: selected, isStart: true, isEnd: false, flow: 'Medium', note: '' }]),
        api.post('/cycles', { period_start: selected }),
      ]);
      router.push('/(auth)/onboarding/reminders');
    } catch {
      setError('We couldn’t save that date. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <StepProgress step={2} total={3} />
      <PageTitle title="When did your last period start?" subtitle="Choose the first day. If you’re not sure, you can skip this." />

      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <BigButton label="‹" accessibilityLabel="Previous month" variant="outline" onPress={() => moveMonth(-1)} style={{ width: 64 }} />
        <Txt variant="h2" style={{ flex: 1, textAlign: 'center' }}>{MONTH_NAMES[month.m0]} {month.y}</Txt>
        <BigButton label="›" accessibilityLabel="Next month" variant="outline" disabled={atCurrentMonth} onPress={() => moveMonth(1)} style={{ width: 64 }} />
      </View>
      <View style={{ marginTop: 12 }}>
        <MonthGrid
          year={month.y}
          month0={month.m0}
          selected={selected ?? undefined}
          onSelect={choose}
          cellState={() => ({ bleeding: false })}
        />
      </View>

      <Txt variant="h3" style={{ marginTop: 16 }}>{selected ? `Chosen: ${formatDate(selected)}` : 'No day chosen yet'}</Txt>

      <View style={{ marginTop: 20, gap: 12 }}>
        <InlineError message={error} />
        <BigButton label={loading ? 'Saving…' : 'Next'} icon="arrow-right" disabled={!selected || loading} onPress={handleNext} />
        <BigButton label="I’m not sure — skip" variant="outline" disabled={loading} onPress={() => router.push('/(auth)/onboarding/reminders')} />
      </View>
    </Screen>
  );
}
