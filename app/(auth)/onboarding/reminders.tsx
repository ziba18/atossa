import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, ChipGroup, FieldLabel, InlineError } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { syncDailyLogReminder } from '../../../lib/notifications';
import { REMINDER_TIMES } from '../../../lib/reminderTimes';
import { track } from '../../../lib/analytics';

// Stored when the reminder is off (as before), so Settings has a time ready if it's turned on.
const DEFAULT_TIME = '20:00';

export default function OnboardingReminders() {
  const router = useRouter();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  // Nothing pre-selected: choosing a time is the "yes"; "Not now" is the "no".
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'on' | 'off' | null>(null);

  const finish = async (enabled: boolean) => {
    const at = enabled && time ? time : DEFAULT_TIME;
    setLoading(enabled ? 'on' : 'off');
    setError('');
    try {
      await api.patch('/me', {
        notifications_enabled: enabled,
        daily_log_reminder_enabled: enabled,
        daily_log_reminder_time: at,
        onboarding_complete: true,
      });
      // Asks for notification permission when turning the reminder on; not critical if refused.
      await syncDailyLogReminder(enabled, at).catch(() => {});
      await fetchProfile();
      track('Onboarding Completed', { reminder: enabled });
      router.replace('/(tabs)/today' as any);
    } catch {
      setError('We couldn’t finish setting up. Check your connection and try again.');
      setLoading(null);
    }
  };

  return (
    <OnboardingScreen
      step={3}
      back={{ label: 'Back' }}
      title="Would a daily reminder help?"
      helper="Anything to note about your body today? Pain, bleeding, sleep or mood – two minutes. You can change this later in Settings."
    >
      <FieldLabel label="What time suits you?" />
      <ChipGroup
        options={REMINDER_TIMES.map((t) => ({ value: t.value, label: t.label }))}
        value={time}
        onChange={setTime}
        allowDeselect
        accessibilityLabel="Reminder time"
      />

      <View style={{ marginTop: space.xxl, gap: space.xs }}>
        <InlineError message={error} style={{ marginBottom: space.xs }} />
        <Button
          label={loading === 'on' ? 'Finishing…' : 'Turn on reminder'}
          loading={loading === 'on'}
          disabled={!time || loading !== null}
          onPress={() => finish(true)}
        />
        <Button
          label={loading === 'off' ? 'Finishing…' : 'Not now'}
          variant="text"
          disabled={loading !== null}
          onPress={() => finish(false)}
        />
      </View>
    </OnboardingScreen>
  );
}
