import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Appointment, Settings } from '../types';
import { apptStart } from '../utils/date';
import { t } from '../i18n';

const isNative = Platform.OS !== 'web';
const MAX_SCHEDULED = 60; // iOS permite maxim 64 notificări programate

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('programari', {
        name: 'Programări',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Reprogramează toate memento-urile pentru programările viitoare. */
export async function rescheduleReminders(appts: Appointment[], settings: Settings): Promise<void> {
  if (!isNative) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (settings.reminderMinutes === null) return;
    if (!(await ensureNotificationPermission())) return;
    const now = Date.now();
    const upcoming = appts
      .filter((a) => a.status === 'programat')
      .map((a) => ({ a, at: apptStart(a.date, a.time).getTime() - (settings.reminderMinutes as number) * 60000 }))
      .filter((x) => x.at > now + 5000)
      .sort((x, y) => x.at - y.at)
      .slice(0, MAX_SCHEDULED);
    for (const { a, at } of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${a.time} · ${a.clientName}`,
          body: a.procedureName + (a.notes ? ` — ${a.notes}` : ''),
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: 'programari' },
      });
    }
  } catch (e) {
    console.warn(t.appName, 'notificări', e);
  }
}
