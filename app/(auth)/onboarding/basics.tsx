import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, ChipGroup, InlineError, TextField, type ChipOption } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { api } from '../../../lib/api';

const CYCLE_OPTIONS = [21, 25, 28, 30, 35];
const PERIOD_OPTIONS = [3, 4, 5, 6, 7];
// Stored when the user doesn't know; the profile fields can't be empty.
const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

type Choice = number | 'unknown' | 'other';

// ChipGroup works in strings; numbers round-trip through String()/Number().
const toChoice = (v: string | null): Choice | null =>
  v == null ? null : v === 'unknown' || v === 'other' ? v : Number(v);
const chipOptions = (options: number[], withOther?: boolean): ChipOption[] => [
  ...options.map((n) => ({ value: String(n), label: `${n} days` })),
  ...(withOther ? [{ value: 'other', label: 'Another number' }] : []),
  { value: 'unknown', label: 'I don’t know', ghost: true },
];

/**
 * Step 2: two questions, shown one at a time on this screen (cycle length, then period length),
 * saved together in one PATCH as before. Nothing is pre-selected; leaving a question unanswered
 * stores the same defaults as "I don't know".
 */
export default function OnboardingBasics() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [part, setPart] = useState<'cycle' | 'period'>('cycle');
  const [cycle, setCycle] = useState<Choice | null>(null);
  const [otherCycle, setOtherCycle] = useState('');
  const [period, setPeriod] = useState<Choice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const otherNumber = parseInt(otherCycle, 10);
  const otherValid = Number.isFinite(otherNumber) && otherNumber >= 14 && otherNumber <= 60;
  const otherError = 'Enter a number of days between 14 and 60, or choose “I don’t know”.';

  const goTo = (next: 'cycle' | 'period') => {
    setError('');
    setPart(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleCycleNext = () => {
    if (cycle === 'other' && !otherValid) { setError(otherError); return; }
    goTo('period');
  };

  const handleNext = async () => {
    if (cycle === 'other' && !otherValid) {
      setError(otherError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch('/me', {
        average_cycle_length: cycle === 'other' ? otherNumber : typeof cycle === 'number' ? cycle : DEFAULT_CYCLE,
        average_period_length: typeof period === 'number' ? period : DEFAULT_PERIOD,
      });
      router.push('/(auth)/onboarding/last-period');
    } catch {
      setError('We couldn’t save that. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (part === 'cycle') {
    return (
      <OnboardingScreen
        step={2}
        scrollRef={scrollRef}
        title="How long between your periods?"
        helper="Count from the first day of one period to the first day of the next. A rough answer is fine, and so is “I don’t know”."
      >
        <ChipGroup
          options={chipOptions(CYCLE_OPTIONS, true)}
          ghosts={['unknown']}
          value={cycle == null ? null : String(cycle)}
          onChange={(v) => { setCycle(toChoice(v)); setError(''); }}
          accessibilityLabel="Days between periods"
        />
        {cycle === 'other' ? (
          <TextField
            label="Number of days"
            value={otherCycle}
            onChangeText={(v) => { setOtherCycle(v.replace(/\D/g, '')); setError(''); }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="For example 32"
            style={{ marginTop: space.xl }}
          />
        ) : null}
        <View style={{ marginTop: space.xxl, gap: space.sm }}>
          <InlineError message={error} />
          <Button label="Next" onPress={handleCycleNext} />
        </View>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen
      step={2}
      scrollRef={scrollRef}
      back={{ label: 'Back', onPress: () => goTo('cycle') }}
      title="How long does your period usually last?"
      helper="Rough is fine. You can change both answers later in your profile."
    >
      <ChipGroup
        options={chipOptions(PERIOD_OPTIONS)}
        ghosts={['unknown']}
        value={period == null ? null : String(period)}
        onChange={(v) => setPeriod(toChoice(v))}
        accessibilityLabel="Days your period lasts"
      />
      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <InlineError message={error} />
        <Button label={loading ? 'Saving…' : 'Next'} loading={loading} onPress={handleNext} />
      </View>
    </OnboardingScreen>
  );
}
