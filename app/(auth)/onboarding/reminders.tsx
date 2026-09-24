import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton, Card, InlineError, PageTitle, Screen, StepProgress, SwitchRow, Txt } from '../../../components/atossa/kit';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { syncDailyLogReminder } from '../../../lib/notifications';
import { REMINDER_TIMES } from '../../../lib/reminderTimes';

export default function OnboardingReminders() {
  const router = useRouter();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('20:00');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    setError('');
    try {
      await api.patch('/me', {
        notifications_enabled: enabled,
        daily_log_reminder_enabled: enabled,
        daily_log_reminder_time: time,
        onboarding_complete: true,
      });
      // Asks for notification permission when turning the reminder on; not critical if refused.
      await syncDailyLogReminder(enabled, time).catch(() => {});
      await fetchProfile();
      router.replace('/(tabs)/chat' as any);
    } catch {
      setError('We couldn’t finish setting up. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <Screen header={false} edges={['top', 'bottom']}>
      <StepProgress step={3} total={3} />
      <PageTitle title="A daily reminder" subtitle="Atossa can remind you once a day to note how you feel. You can change this later in Settings." />

      <Card style={{ marginTop: 20, gap: 12 }}>
        <SwitchRow label="Remind me every day" value={enabled} onChange={setEnabled} />
        {enabled ? (
          <View style={{ gap: 10 }}>
            <Txt variant="bodyBold">What time?</Txt>
            {REMINDER_TIMES.map((t) => (
              <BigButton key={t.value} label={t.label} variant="outline" selected={time === t.value} onPress={() => setTime(t.value)} />
            ))}
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: 24, gap: 12 }}>
        <InlineError message={error} />
        <BigButton label={loading ? 'Finishing…' : 'Start using Atossa'} icon="check" disabled={loading} onPress={finish} />
      </View>
    </Screen>
  );
}
