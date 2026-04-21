import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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

export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
