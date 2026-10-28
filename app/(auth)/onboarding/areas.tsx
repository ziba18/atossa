import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, ChipGroup, type ChipOption } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { track } from '../../../lib/analytics';

// The six onset groups, in app words (pm/prd/onset-and-treatments.md, onboarding decision).
const AREAS: ChipOption[] = [
  { value: 'pain', label: 'Pain' },
  { value: 'bleeding', label: 'Bleeding' },
  { value: 'bowelBladder', label: 'Tummy, bowel or bladder' },
  { value: 'fatigue', label: 'Tired' },
  { value: 'mood', label: 'Mood' },
  { value: 'skinHair', label: 'Skin or hair' },
];

/** Step 3: what she wants to keep track of. Only decides which rows the next screen asks about; nothing else is hidden. */
export default function OnboardingAreas() {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);

  const next = () => {
    track('Onboarding Step Completed', { step: 'areas' });
    if (picked.length === 0) router.push('/(auth)/onboarding/reminders');
    else router.push({ pathname: '/(auth)/onboarding/onset', params: { groups: picked.join(',') } } as any);
  };

  return (
    <OnboardingScreen
      step={3}
      back={{ label: 'Back', onPress: () => router.back() }}
      title="What do you want to keep track of?"
      helper="Pick any that apply. You can add more later, and you can skip this."
    >
      <ChipGroup
        mode="multi"
        options={AREAS}
        value={picked}
        onChange={setPicked}
        accessibilityLabel="Things to keep track of"
      />
      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <Button label={picked.length ? 'Next' : 'Skip for now'} variant={picked.length ? 'primary' : 'secondary'} onPress={next} />
      </View>
    </OnboardingScreen>
  );
}
