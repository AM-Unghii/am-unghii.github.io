import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Appointment, Settings } from '../types';
import { apptStart } from '../utils/date';
import { t } from '../i18n';
import { apptName } from '../utils/appts';

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

/** Anulează doar memento-urile programărilor (nu și notificarea de test). */
async function cancelApptReminders() {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of list) {
    if ((n.content.data as any)?.kind !== 'test') await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

/** Reprogramează toate memento-urile pentru programările viitoare (doar dacă notificările vin din aplicație). */
export async function rescheduleReminders(appts: Appointment[], settings: Settings): Promise<void> {
  if (!isNative) return;
  try {
    await cancelApptReminders();
    if (settings.reminderMinutes === null || settings.notifyVia !== 'app') return;
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
          title: `${a.time} · ${apptName(a)}`,
          body: (a.personal && a.clientName ? a.procedureName : a.personal ? t.personal.badge : a.procedureName) + (a.notes ? ` — ${a.notes}` : ''),
          sound: true,
          data: { kind: 'appt', id: a.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: 'programari' },
      });
    }
  } catch (e) {
    console.warn(t.appName, 'notificări', e);
  }
}

/** Notificare de test: pe telefon peste 10 secunde, în browser imediat. */
export async function sendTestNotification(): Promise<'ok' | 'denied'> {
  if (!isNative) {
    const N = (globalThis as any).Notification;
    if (!N) return 'denied';
    const perm = N.permission === 'granted' ? 'granted' : await N.requestPermission();
    if (perm !== 'granted') return 'denied';
    new N(t.settings.testTitle, { body: t.settings.testBody, icon: 'icon-192.png' });
    return 'ok';
  }
  if (!(await ensureNotificationPermission())) return 'denied';
  await Notifications.scheduleNotificationAsync({
    content: { title: t.settings.testTitle, body: t.settings.testBody, sound: true, data: { kind: 'test' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: 'programari' },
  });
  return 'ok';
}
