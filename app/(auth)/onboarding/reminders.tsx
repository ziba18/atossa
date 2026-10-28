import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { Button, ChipGroup, FieldLabel, InlineError } from '../../../components/atossa/kit';
import { OnboardingScreen } from '../../../components/auth/OnboardingScreen';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { syncDailyLogReminder, DAILY_LOG_REMINDER_BODY } from '../../../lib/notifications';
import { REMINDER_TIMES } from '../../../lib/reminderTimes';
import { track } from '../../../lib/analytics';
import { usePageTitle } from '../../../lib/usePageTitle';

// Stored when the reminder is off (as before), so Settings has a time ready if it's turned on.
const DEFAULT_TIME = '20:00';

export default function OnboardingReminders() {
  usePageTitle('Reminders');
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

  // The web build can't schedule notifications, so don't offer a reminder that would never arrive.
  if (Platform.OS === 'web') {
    return (
      <OnboardingScreen
        step={5}
        back={{ label: 'Back' }}
        title="Reminders come with the iPhone app"
        helper="On the web, Atossa can’t remind you yet. You can still add a note any time you open it."
      >
        <View style={{ marginTop: space.xxl, gap: space.xs }}>
          <InlineError message={error} style={{ marginBottom: space.xs }} />
          <Button
            label={loading ? 'Finishing…' : 'Continue'}
            loading={loading !== null}
            disabled={loading !== null}
            onPress={() => finish(false)}
          />
        </View>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen
      step={5}
      back={{ label: 'Back' }}
      title="Would a daily reminder help?"
      helper={`The reminder says: “${DAILY_LOG_REMINDER_BODY}” You can change this later in Settings.`}
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
