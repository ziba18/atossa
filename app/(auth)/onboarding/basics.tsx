import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton, InlineError, PageTitle, Screen, StepProgress, TextField, Txt } from '../../../components/atossa/kit';
import { api } from '../../../lib/api';

const CYCLE_OPTIONS = [21, 25, 28, 30, 35];
const PERIOD_OPTIONS = [3, 4, 5, 6, 7];
// Stored when the user doesn't know; the profile fields can't be empty.
const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

type Choice = number | 'unknown' | 'other';

function Choices({ options, value, onChange, withOther }: { options: number[]; value: Choice; onChange: (c: Choice) => void; withOther?: boolean }) {
  const all: Choice[] = [...options, ...(withOther ? (['other'] as Choice[]) : []), 'unknown'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
      {all.map((c) => (
        <BigButton
          key={String(c)}
          label={c === 'unknown' ? 'I don’t know' : c === 'other' ? 'Another number' : `${c} days`}
          variant="outline"
          selected={value === c}
          onPress={() => onChange(c)}
          style={{ flexGrow: 1, flexBasis: typeof c === 'number' ? '30%' : '46%' }}
        />
      ))}
    </View>
  );
}

export default function OnboardingBasics() {
  const router = useRouter();
  const [cycle, setCycle] = useState<Choice>('unknown');
  const [otherCycle, setOtherCycle] = useState('');
  const [period, setPeriod] = useState<Choice>('unknown');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const otherNumber = parseInt(otherCycle, 10);
  const otherValid = Number.isFinite(otherNumber) && otherNumber >= 14 && otherNumber <= 60;

  const handleNext = async () => {
    if (cycle === 'other' && !otherValid) {
      setError('Enter a number of days between 14 and 60, or choose “I don’t know”.');
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

  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <StepProgress step={1} total={3} />
      <PageTitle title="About your periods" subtitle="Rough answers are fine, and so is “I don’t know”. You can change these later in your profile." />

      <View style={{ marginTop: 24 }}>
        <Txt variant="h3">How many days from the start of one period to the start of the next?</Txt>
        <Choices options={CYCLE_OPTIONS} value={cycle} onChange={setCycle} withOther />
        {cycle === 'other' ? (
          <TextField
            label="Number of days"
            value={otherCycle}
            onChangeText={(v) => { setOtherCycle(v.replace(/\D/g, '')); setError(''); }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="For example 32"
            style={{ marginTop: 16 }}
          />
        ) : null}
      </View>

      <View style={{ marginTop: 28 }}>
        <Txt variant="h3">How many days does your period usually last?</Txt>
        <Choices options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </View>

      <View style={{ marginTop: 28, gap: 12 }}>
        <InlineError message={error} />
        <BigButton label={loading ? 'Saving…' : 'Next'} icon="arrow-right" disabled={loading} onPress={handleNext} />
      </View>
    </Screen>
  );
}
