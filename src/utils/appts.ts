import { Appointment, ListPrefs, Reschedule } from '../types';
import { addDays, startOfWeek, toMin } from './date';

export const defaultListPrefs: ListPrefs = { sort: 'data', period: 'viitoare', status: 'toate' };

/** „YYYY-MM-DD HH:mm” */
export const slotKey = (date: string, time: string) => `${date} ${time}`;

/**
 * Dacă data sau ora s-au schimbat, întoarce istoricul cu o mutare în plus.
 * Altfel întoarce istoricul neschimbat.
 */
export function addReschedule(old: Pick<Appointment, 'date' | 'time' | 'reschedules'>, date: string, time: string, at: string): Reschedule[] | undefined {
  if (old.date === date && old.time === time) return old.reschedules;
  return [...(old.reschedules || []), { from: slotKey(old.date, old.time), to: slotKey(date, time), at }];
}

export const rescheduleCount = (a: Pick<Appointment, 'reschedules'>) => a.reschedules?.length || 0;

/** Acceptă „14”, „1430”, „14:30”, „14.30”, „9:5” → „HH:mm”; null dacă nu e o oră. */
export function parseTime(raw: string): string | null {
  const s = raw.trim().replace(/[.,h ]/g, ':');
  let h: number, m: number;
  const m1 = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  if (m1) { h = Number(m1[1]); m = Number(m1[2]); }
  else if (/^\d{1,2}$/.test(s)) { h = Number(s); m = 0; }
  else if (/^\d{3,4}$/.test(s)) { h = Number(s.slice(0, s.length - 2)); m = Number(s.slice(-2)); }
  else return null;
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Programările care se suprapun cu intervalul dat (fără cele anulate și fără programarea însăși). */
export function overlapping(list: Appointment[], date: string, time: string, dur: number, exceptId?: string): Appointment[] {
  const s = toMin(time);
  const e = s + dur;
  return list.filter((x) => x.id !== exceptId && x.date === date && x.status !== 'anulat' && toMin(x.time) < e && toMin(x.time) + x.durationMin > s);
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function filterAppts(list: Appointment[], p: ListPrefs, today: string, search = ''): Appointment[] {
  const q = norm(search.trim());
  const ws = startOfWeek(today);
  const we = addDays(ws, 6);
  return list.filter((a) => {
    if (p.period === 'viitoare' && a.date < today) return false;
    if (p.period === 'azi' && a.date !== today) return false;
    if (p.period === 'saptamana' && (a.date < ws || a.date > we)) return false;
    if (p.period === 'trecute' && a.date >= today) return false;
    if (p.status === 'reprogramate' ? !rescheduleCount(a) : p.status !== 'toate' && a.status !== p.status) return false;
    if (q && !norm([a.clientName, a.phone || '', a.procedureName, a.notes || ''].join(' ')).includes(q)) return false;
    return true;
  });
}

export function sortAppts(list: Appointment[], sort: ListPrefs['sort']): Appointment[] {
  const when = (a: Appointment) => a.date + a.time;
  const out = [...list];
  const cmp: Record<ListPrefs['sort'], (x: Appointment, y: Appointment) => number> = {
    data: (x, y) => when(x).localeCompare(when(y)),
    dataDesc: (x, y) => when(y).localeCompare(when(x)),
    nume: (x, y) => x.clientName.localeCompare(y.clientName, 'ro') || when(x).localeCompare(when(y)),
    procedura: (x, y) => x.procedureName.localeCompare(y.procedureName, 'ro') || when(x).localeCompare(when(y)),
    adaugate: (x, y) => y.createdAt.localeCompare(x.createdAt),
  };
  return out.sort(cmp[sort]);
}
