import { Platform, Linking } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { Appointment } from '../types';
import { apptStart } from '../utils/date';
import { t } from '../i18n';

const isNative = Platform.OS !== 'web';

async function targetCalendarId(): Promise<string | null> {
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = cals.filter((c) => c.allowsModifications);
  const pick =
    writable.find((c) => c.isPrimary) ||
    writable.find((c) => c.source?.type === 'com.google') ||
    writable[0];
  return pick ? pick.id : null;
}

export async function ensureCalendarPermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const cur = await Calendar.getCalendarPermissionsAsync();
    if (cur.granted) return true;
    return (await Calendar.requestCalendarPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

function details(a: Appointment, reminder: number | null) {
  const start = apptStart(a.date, a.time);
  const end = new Date(start.getTime() + a.durationMin * 60000);
  return {
    title: `${a.clientName} · ${a.procedureName}`,
    startDate: start,
    endDate: end,
    notes: [a.phone ? `Tel: ${a.phone}` : '', a.notes || ''].filter(Boolean).join('\n'),
    alarms: reminder !== null ? [{ relativeOffset: -reminder }] : [],
  };
}

/** Creează/actualizează evenimentul în calendarul telefonului; întoarce id-ul. */
export async function syncEvent(a: Appointment, reminder: number | null): Promise<string | undefined> {
  if (!isNative) return a.calendarEventId;
  try {
    if (!(await ensureCalendarPermission())) return a.calendarEventId;
    if (a.status === 'anulat') {
      await removeEvent(a.calendarEventId);
      return undefined;
    }
    if (a.calendarEventId) {
      try {
        await Calendar.updateEventAsync(a.calendarEventId, details(a, reminder));
        return a.calendarEventId;
      } catch {
        /* evenimentul a dispărut din calendar → îl refacem mai jos */
      }
    }
    const calId = await targetCalendarId();
    if (!calId) return undefined;
    return await Calendar.createEventAsync(calId, details(a, reminder));
  } catch (e) {
    console.warn(t.appName, 'calendar', e);
    return a.calendarEventId;
  }
}

export async function removeEvent(eventId?: string): Promise<void> {
  if (!isNative || !eventId) return;
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    /* deja șters */
  }
}

/** Link „Adaugă în Google Calendar” (merge pe web și pe telefon). */
export function googleCalendarUrl(a: Appointment): string {
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T` +
    `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const start = apptStart(a.date, a.time);
  const end = new Date(start.getTime() + a.durationMin * 60000);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${a.clientName} · ${a.procedureName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [a.phone ? `Tel: ${a.phone}` : '', a.notes || ''].filter(Boolean).join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export const openGoogleCalendar = (a: Appointment) => Linking.openURL(googleCalendarUrl(a));

