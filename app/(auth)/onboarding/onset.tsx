import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, ChipGroup, InlineError, type ChipOption } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { track } from '../../../lib/analytics';
import { todayKey } from '../../../lib/records/dates';
import { ONSET_GROUP_LABEL, ONSET_TYPE, onsetFromHistory, type OnsetGroup } from '../../../lib/records/summary';
import { useRecordsStore } from '../../../stores/recordsStore';

const ORDER: OnsetGroup[] = ['pain', 'bleeding', 'bowelBladder', 'fatigue', 'mood', 'skinHair'];
const YEARS_BACK = 30;
const RECENT_YEARS = 10;

/**
 * Step 4: "When did you first notice this?" once for each area she ticked. A year she picks (or "Not sure")
 * goes in the same onset store the capture confirm row writes; it is never worked out from anything else.
 * "Skip" saves nothing for that area.
 */
export default function OnboardingOnset() {
  const router = useRouter();
  const { groups, edit } = useLocalSearchParams<{ groups?: string; edit?: string }>();
  const create = useRecordsStore((s) => s.create);
  const list = useMemo(() => ORDER.filter((g) => (groups ?? '').split(',').includes(g)), [groups]);
  const [i, setI] = useState(0);
  // Years picked so far, by area, so Back and Next never lose an answer.
  const history = useRecordsStore((s) => s.records.history);
  const [years, setYears] = useState<Record<string, string | null>>(() => {
    // Opened from Profile: start from the year she already saved for each area.
    if (!edit) return {};
    const on = onsetFromHistory(history);
    return Object.fromEntries(Object.entries(on).map(([g, o]) => [g, o?.year ? String(o.year) : o?.notSure ? 'Not sure' : null]));
  });
  const saved = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const thisYear = new Date().getFullYear();
  // The last ten years first; "Earlier years…" opens the older ones (also open when an older year is already picked).
  const [showEarlier, setShowEarlier] = useState(false);

  const group = list[i];
  if (!group) return null;
  const year = years[group] ?? null;
  const older = year !== null && /^\d{4}$/.test(year) && thisYear - Number(year) >= RECENT_YEARS;
  const expanded = showEarlier || older;
  const options: ChipOption[] = [
    ...Array.from({ length: expanded ? YEARS_BACK + 1 : RECENT_YEARS }, (_, k) => String(thisYear - k)),
    { value: 'Not sure', ghost: true },
  ];
  const setYear = (v: string | null) => setYears((y) => ({ ...y, [group]: v }));
  const area = ONSET_GROUP_LABEL[group];
  const last = i === list.length - 1;

  const advance = () => {
    setError('');
    if (last && edit) router.back(); // opened from Profile: return there, not on to Reminders
    else if (last) { track('Onboarding Step Completed', { step: 'onset' }); router.push('/(auth)/onboarding/reminders'); }
    else setI(i + 1);
  };
  const save = async () => {
    if (!year || busy) return;
    setBusy(true);
    setError('');
    try {
      // Back then Next on an answer already saved does not file it twice.
      if (saved.current[group] !== year) await create('history', { type: ONSET_TYPE, date: todayKey(), datePrecision: 'exact', told: year, done: group, result: '' });
      saved.current[group] = year;
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
      editing={Boolean(edit)}
      back={{ label: 'Back', onPress: () => (i > 0 ? setI(i - 1) : router.back()) }}
      title="When did you first notice this?"
      badge={`${area[0].toUpperCase()}${area.slice(1)}`}
      helper="Pick the year. A rough answer is fine, and so is “Not sure”."
    >
      <ChipGroup
        options={options}
        ghosts={['Not sure']}
        value={year}
        onChange={setYear}
        accessibilityLabel={`Year you first noticed ${area}`}
      />
      {/* A button outside the year group, so arrow keys never trigger it; it stays on screen and toggles, so keyboard focus is not lost. */}
      {older ? null : (
        <Button
          label={showEarlier ? 'Show fewer years' : 'Earlier years…'}
          variant="text"
          align="start"
          onPress={() => setShowEarlier((v) => !v)}
          accessibilityHint="Shows or hides the years before the last ten"
        />
      )}
      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <InlineError message={error} />
        <Button label={busy ? 'Saving…' : last ? 'Next' : 'Next area'} loading={busy} disabled={!year} onPress={save} />
        <Button label="Skip" variant="text" onPress={advance} />
      </View>
    </OnboardingScreen>
  );
}
