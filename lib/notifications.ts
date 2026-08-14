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

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  // Android requires an explicit notification channel for any notification to
  // display — without one, scheduled local notifications silently no-op.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#DC143C',
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

export async function schedulePeriodReminder(
  periodStartDate: string,
  daysBeforeReminder = 2
): Promise<void> {
  try {
    const triggerDate = new Date(periodStartDate);
    triggerDate.setDate(triggerDate.getDate() - daysBeforeReminder);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: PERIOD_REMINDER_ID,
      content: {
        title: 'Period Coming Soon',
        body: `Your period is expected in ${daysBeforeReminder} days. Stock up on supplies!`,
        data: { type: 'period_upcoming' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch {
    // Scheduling not supported in this environment
  }
}

export async function scheduleOvulationReminder(ovulationDate: string): Promise<void> {
  try {
    const triggerDate = new Date(ovulationDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(8, 0, 0, 0);
    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: OVULATION_REMINDER_ID,
      content: {
        title: '💛 Ovulation Window',
        body: 'Your fertile window is approaching. Ovulation is expected tomorrow.',
        data: { type: 'ovulation_upcoming' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch {
    // Scheduling not supported in this environment
  }
}

// Cancels only the date-specific cycle reminders, leaving recurring ones
// (e.g. the daily log reminder) scheduled. Called before re-scheduling
// period/ovulation reminders off a fresh prediction.
export async function cancelPeriodAndOvulationReminders(): Promise<void> {
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
        title: 'How are you feeling today?',
        body: "Take a moment to log today's symptoms, mood, and notes.",
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
  const granted = await registerForPushNotifications();
  if (granted === null) {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
  }
  await scheduleDailyLogReminder(time);
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
