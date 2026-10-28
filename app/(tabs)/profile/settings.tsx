import React, { useCallback } from 'react';
import { View, Platform } from 'react-native';
import { space } from '../../../constants/atossaUI';
import { Card, ChipGroup, FieldLabel, ScreenLarge, SwitchRow, Txt } from '../../../components/atossa/kit';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { syncDailyLogReminder, DAILY_LOG_REMINDER_BODY } from '../../../lib/notifications';
import { REMINDER_TIMES } from '../../../lib/reminderTimes';
import { usePageTitle } from '../../../lib/usePageTitle';

export default function SettingsScreen() {
  usePageTitle('Reminders');
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

  // The web build can't schedule notifications, so no switches that would look like they work.
  if (Platform.OS === 'web') {
    return (
      <ScreenLarge title="Reminders" back={{ label: 'Profile' }}>
        <Card style={{ gap: space.xs }}>
          <Txt variant="headline">Reminders come with the iPhone app</Txt>
          <Txt variant="secondary">On the web, Atossa can’t remind you yet. You can still add a note any time you open it.</Txt>
        </Card>
      </ScreenLarge>
    );
  }

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
            <Txt variant="caption" style={{ marginTop: space.sm }}>
              {`The reminder says: “${DAILY_LOG_REMINDER_BODY}”`}
            </Txt>
          </View>
        ) : null}
      </Card>
    </ScreenLarge>
  );
}
