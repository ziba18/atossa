import React, { useCallback } from 'react';
import { Platform, View } from 'react-native';
import { space } from '../../../constants/atossaUI';
import { Card, ChipGroup, FieldLabel, ScreenLarge, SwitchRow, Txt } from '../../../components/atossa/kit';
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
    <ScreenLarge title="Reminders" back={{ label: 'Profile' }}>
      <Card style={{ gap: space.xs }}>
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
          <View style={{ marginTop: space.xs }}>
            <FieldLabel label="Reminder time" />
            <ChipGroup
              options={REMINDER_TIMES.map((t) => ({ value: t.value, label: t.label }))}
              ghosts={[]}
              value={reminderTime}
              accessibilityLabel="Reminder time"
              onChange={(v) => {
                if (!v) return;
                persist({ daily_log_reminder_time: v });
                syncDailyLogReminder(true, v).catch(() => {});
              }}
            />
          </View>
        ) : null}
      </Card>
      {Platform.OS === 'web' ? (
        <Txt variant="secondary" style={{ marginTop: space.md }}>
          Reminders are sent by the phone app. Your choices here are saved, but a web browser won’t show them.
        </Txt>
      ) : null}
    </ScreenLarge>
  );
}
