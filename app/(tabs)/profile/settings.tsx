import React, { useCallback } from 'react';
import { View } from 'react-native';
import { BackButton, BigButton, Card, PageTitle, Screen, SwitchRow, Txt } from '../../../components/atossa/kit';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { syncDailyLogReminder } from '../../../lib/notifications';
import { REMINDER_TIMES } from '../../../lib/reminderTimes';

export default function SettingsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  // Update the screen straight away and save in the background.
  const persist = useCallback(
    (updates: Record<string, unknown>) => {
      const current = useAuthStore.getState().profile;
      if (current) setProfile({ ...current, ...updates } as typeof current);
      api.patch('/me', updates).catch(() => {});
    },
    [setProfile],
  );

  const reminderOn = profile?.daily_log_reminder_enabled ?? true;
  const reminderTime = profile?.daily_log_reminder_time ?? '20:00';

  return (
    <Screen header={false}>
      <BackButton label="Back" />
      <View style={{ marginTop: 20 }}><PageTitle title="Settings" /></View>

      <Card style={{ marginTop: 16, gap: 8 }}>
        <SwitchRow
          label="Notifications"
          description="Allow Atossa to send you notifications"
          value={profile?.notifications_enabled ?? true}
          onChange={(v) => persist({ notifications_enabled: v })}
        />
        <SwitchRow
          label="Daily reminder"
          description="A daily nudge to note how you’re feeling"
          value={reminderOn}
          onChange={(v) => {
            persist({ daily_log_reminder_enabled: v });
            syncDailyLogReminder(v, reminderTime).catch(() => {});
          }}
        />
        {reminderOn ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Txt variant="bodyBold">Reminder time</Txt>
            {REMINDER_TIMES.map((t) => (
              <BigButton
                key={t.value}
                label={t.label}
                variant="outline"
                selected={reminderTime === t.value}
                onPress={() => {
                  persist({ daily_log_reminder_time: t.value });
                  syncDailyLogReminder(true, t.value).catch(() => {});
                }}
              />
            ))}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
