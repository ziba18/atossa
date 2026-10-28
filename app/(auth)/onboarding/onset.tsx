import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, ChipGroup, InlineError, type ChipOption } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { track } from '../../../lib/analytics';
import { todayKey } from '../../../lib/records/dates';
import { ONSET_GROUP_LABEL, ONSET_TYPE, type OnsetGroup } from '../../../lib/records/summary';
import { useRecordsStore } from '../../../stores/recordsStore';

const ORDER: OnsetGroup[] = ['pain', 'bleeding', 'bowelBladder', 'fatigue', 'mood', 'skinHair'];
const YEARS_BACK = 30;

/**
 * Step 4: "When did you first notice this?" once for each area she ticked. A year she picks (or "Not sure")
 * goes in the same onset store the capture confirm row writes; it is never worked out from anything else.
 * "Skip" saves nothing for that area.
 */
export default function OnboardingOnset() {
  const router = useRouter();
  const { groups } = useLocalSearchParams<{ groups?: string }>();
  const create = useRecordsStore((s) => s.create);
  const list = useMemo(() => ORDER.filter((g) => (groups ?? '').split(',').includes(g)), [groups]);
  const [i, setI] = useState(0);
  const [year, setYear] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const thisYear = new Date().getFullYear();
  const options: ChipOption[] = useMemo(() => [
    ...Array.from({ length: YEARS_BACK + 1 }, (_, k) => String(thisYear - k)),
    { value: 'Not sure', ghost: true },
  ], [thisYear]);

  const group = list[i];
  if (!group) return null;
  const area = ONSET_GROUP_LABEL[group];
  const last = i === list.length - 1;

  const advance = () => {
    setError('');
    setYear(null);
    if (last) { track('Onboarding Step Completed', { step: 'onset' }); router.push('/(auth)/onboarding/reminders'); }
    else setI(i + 1);
  };
  const save = async () => {
    if (!year || busy) return;
    setBusy(true);
    setError('');
    try {
      await create('history', { type: ONSET_TYPE, date: todayKey(), datePrecision: 'exact', told: year, done: group, result: '' });
      advance();
    } catch {
      setError('That didn’t save. Check your connection and try again, or skip this one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      step={4}
      back={{ label: 'Back', onPress: () => (i > 0 ? (setYear(null), setI(i - 1)) : router.back()) }}
      title="When did you first notice this?"
      helper={`${area[0].toUpperCase()}${area.slice(1)}. Pick the year. A rough answer is fine, and so is “Not sure”.`}
    >
      <ChipGroup
        options={options}
        ghosts={['Not sure']}
        value={year}
        onChange={setYear}
        accessibilityLabel={`Year you first noticed ${area}`}
      />
      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <InlineError message={error} />
        <Button label={busy ? 'Saving…' : last ? 'Next' : 'Next area'} loading={busy} disabled={!year} onPress={save} />
        <Button label="Skip" variant="text" onPress={advance} />
      </View>
    </OnboardingScreen>
  );
}
