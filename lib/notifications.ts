import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  // Android requires an explicit notification channel for any notification to
  // display — without one, scheduled local notifications silently no-op.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8f3830',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    // getExpoPushTokenAsync requires a valid EAS projectId — skip gracefully in Expo Go
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'your-eas-project-id') return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    // Remote push tokens don't work in Expo Go — local notifications still do
    return null;
  }
}

const PERIOD_REMINDER_ID = 'period-reminder';
const OVULATION_REMINDER_ID = 'ovulation-reminder';
const DAILY_LOG_REMINDER_ID = 'daily-log-reminder';

// Cancels the period/ovulation reminders older builds scheduled from a
// cycle prediction, leaving the daily log reminder alone.
export async function cancelPredictedCycleReminders(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(PERIOD_REMINDER_ID);
  } catch {
    // Nothing scheduled under this id — ignore
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(OVULATION_REMINDER_ID);
  } catch {
    // Nothing scheduled under this id — ignore
  }
}

// Schedules (or replaces, since it reuses a fixed identifier) a repeating
// local notification at the given local time to nudge the user to log
// today's symptoms/mood in the chat.
export async function scheduleDailyLogReminder(time: string): Promise<void> {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_LOG_REMINDER_ID,
      content: {
        title: 'Atossa',
        body: "If today's worth noting, I'm here. Two minutes is plenty.",
        data: { type: 'daily_log_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  } catch {
    // Scheduling not supported in this environment
  }
}

export async function cancelDailyLogReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_LOG_REMINDER_ID);
  } catch {
    // Nothing scheduled under this id — ignore
  }
}

// Brings the OS-scheduled daily reminder in line with the user's profile
// preference. Safe to call on every app start / settings change — scheduling
// reuses a fixed identifier so it replaces rather than duplicates.
export async function syncDailyLogReminder(enabled: boolean, time: string): Promise<void> {
  if (!enabled) {
    await cancelDailyLogReminder();
    return;
  }
  // Local reminders only need the permission; asking Expo for a push token would register the phone with a third party for nothing.
  if (!(await ensureNotificationPermission())) return;
  await scheduleDailyLogReminder(time);
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
