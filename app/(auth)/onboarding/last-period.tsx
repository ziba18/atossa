import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, space } from '../../../constants/atossaUI';
import { Button, Card, DayChooser, InlineError, Txt } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { api } from '../../../lib/api';
import { useRecordsStore } from '../../../stores/recordsStore';
import { isFuture } from '../../../lib/records/dates';
import { formatDay } from '../../../lib/records/format';

export default function OnboardingLastPeriod() {
  const router = useRouter();
  const savePeriodDays = useRecordsStore((s) => s.savePeriodDays);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const choose = (key: string) => {
    setError(isFuture(key) ? 'Choose today or a day before today.' : '');
    setSelected(isFuture(key) ? null : key);
  };

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      // Timeline reads period days; Friends reads /cycles. Save to both.
      await Promise.all([
        savePeriodDays([{ date: selected, status: 'started', isStart: true, isEnd: false, note: '' }]),
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
    <OnboardingScreen
      step={3}
      back={{ label: 'Back' }}
      title="When did your last period start?"
      helper="Choose the first day. If you’re not sure, that’s fine."
    >
      <Card>
        <DayChooser value={selected ?? ''} onChange={choose} />
      </Card>
      <Txt variant="body" color={selected ? colors.ink : colors.ink2} style={{ marginTop: space.md }} accessibilityLiveRegion="polite">
        {selected ? `First day: ${formatDay(selected, 'always')}` : 'No day chosen yet'}
      </Txt>

      <View style={{ marginTop: space.xxl, gap: space.xs }}>
        <InlineError message={error} style={{ marginBottom: space.xs }} />
        <Button label={loading ? 'Saving…' : 'Next'} loading={loading} disabled={!selected} onPress={handleNext} />
        <Button label="I’m not sure" variant="text" disabled={loading} onPress={() => router.push('/(auth)/onboarding/reminders')} />
      </View>
    </OnboardingScreen>
  );
}
