import { Platform, Linking } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { Appointment } from '../types';
import { apptStart } from '../utils/date';
import { t } from '../i18n';

const isNative = Platform.OS !== 'web';

export interface DeviceCalendar { id: string; title: string; account: string; color?: string; primary: boolean }

/** Calendarele din telefon în care se poate scrie (cu contul / e-mailul lor). */
export async function listWritableCalendars(): Promise<DeviceCalendar[]> {
  if (!isNative) return [];
  try {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return cals
      .filter((c) => c.allowsModifications)
      .map((c) => ({
        id: c.id,
        title: c.title,
        account: c.ownerAccount || c.source?.name || '',
        color: c.color,
        primary: !!c.isPrimary,
      }));
  } catch {
    return [];
  }
}

async function targetCalendarId(preferred?: string): Promise<string | null> {
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = cals.filter((c) => c.allowsModifications);
  const pick =
    (preferred ? writable.find((c) => c.id === preferred) : undefined) ||
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

const title = (a: Appointment) => `${a.clientName} · ${a.procedureName}`;
/** Marcaj în notițele evenimentului, ca să-l regăsim chiar dacă id-ul s-a pierdut */
const tag = (a: Appointment) => `#am-${a.id}`;

function details(a: Appointment, reminder: number | null) {
  const start = apptStart(a.date, a.time);
  const end = new Date(start.getTime() + a.durationMin * 60000);
  return {
    title: title(a),
    startDate: start,
    endDate: end,
    notes: [a.phone ? `Tel: ${a.phone}` : '', a.notes || '', tag(a)].filter(Boolean).join('\n'),
    alarms: reminder !== null ? [{ relativeOffset: -reminder }] : [],
  };
}

/** Creează/actualizează evenimentul în calendarul telefonului; întoarce id-ul. */
export async function syncEvent(a: Appointment, reminder: number | null, calendarId?: string): Promise<string | undefined> {
  if (!isNative) return a.calendarEventId;
  try {
    if (!(await ensureCalendarPermission())) return a.calendarEventId;
    if (a.status === 'anulat') {
      await removeEvent(a);
      return undefined;
    }
    const calId = await targetCalendarId(calendarId);
    if (!calId) return undefined;
    if (a.calendarEventId) {
      try {
        const ev = await Calendar.getEventAsync(a.calendarEventId);
        if (ev && ev.calendarId === calId) {
          await Calendar.updateEventAsync(a.calendarEventId, details(a, reminder));
          return a.calendarEventId;
        }
        // e în alt calendar (s-a schimbat alegerea) → îl mutăm
        await Calendar.deleteEventAsync(a.calendarEventId);
      } catch {
        /* evenimentul a dispărut din calendar → îl refacem mai jos */
      }
    }
    return await Calendar.createEventAsync(calId, details(a, reminder));
  } catch (e) {
    console.warn(t.appName, 'calendar', e);
    return a.calendarEventId;
  }
}

/**
 * Șterge evenimentul programării din calendarul telefonului.
 * Dacă id-ul lipsește sau e greșit, caută evenimentul după marcaj / titlu în ziua programării.
 */
export async function removeEvent(a: Pick<Appointment, 'id' | 'date' | 'time' | 'durationMin' | 'clientName' | 'procedureName' | 'calendarEventId'>): Promise<void> {
  if (!isNative) return;
  let done = false;
  if (a.calendarEventId) {
    try { await Calendar.deleteEventAsync(a.calendarEventId); done = true; } catch { /* deja șters */ }
  }
  if (done) return;
  try {
    const perm = await Calendar.getCalendarPermissionsAsync();
    if (!perm.granted) return;
    const cals = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter((c) => c.allowsModifications);
    if (!cals.length) return;
    const start = apptStart(a.date, a.time);
    const from = new Date(start.getTime() - 60000);
    const to = new Date(start.getTime() + a.durationMin * 60000 + 60000);
    const events = await Calendar.getEventsAsync(cals.map((c) => c.id), from, to);
    const want = title(a as Appointment);
    for (const ev of events) {
      if ((ev.notes || '').includes(`#am-${a.id}`) || ev.title === want) {
        try { await Calendar.deleteEventAsync(ev.id); } catch { /* ignorăm */ }
      }
    }
  } catch {
    /* fără acces la calendar */
  }
}

/** Eveniment de test peste 2 minute, cu alarmă la început. Întoarce numele calendarului. */
export async function createTestEvent(calendarId?: string): Promise<string | null> {
  if (!isNative || !(await ensureCalendarPermission())) return null;
  const calId = await targetCalendarId(calendarId);
  if (!calId) return null;
  const start = new Date(Date.now() + 2 * 60000);
  await Calendar.createEventAsync(calId, {
    title: t.settings.testTitle,
    startDate: start,
    endDate: new Date(start.getTime() + 15 * 60000),
    notes: t.settings.testBody,
    alarms: [{ relativeOffset: 0 }],
  });
  const cal = (await listWritableCalendars()).find((c) => c.id === calId);
  return cal ? (cal.account && cal.account !== cal.title ? `${cal.title} (${cal.account})` : cal.title) : '';
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
