import { t } from '../i18n';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export const todayISO = () => toISO(new Date());

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function addMonths(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}
export function addYears(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(1);
  d.setFullYear(d.getFullYear() + n);
  return toISO(d);
}
/** Luni = prima zi a săptămânii */
export function startOfWeek(iso: string): string {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toISO(d);
}
export const startOfMonth = (iso: string) => iso.slice(0, 8) + '01';
export function endOfMonth(iso: string) {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
export const startOfYear = (iso: string) => iso.slice(0, 4) + '-01-01';
export const endOfYear = (iso: string) => iso.slice(0, 4) + '-12-31';

export function rangeDays(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard++ < 800) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export const dowIndex = (iso: string) => fromISO(iso).getDay();
export const dayNum = (iso: string) => Number(iso.slice(8, 10));
export const monthIdx = (iso: string) => Number(iso.slice(5, 7)) - 1;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** „Luni, 3 noiembrie” */
export function longDate(iso: string): string {
  return `${cap(t.days[dowIndex(iso)])}, ${dayNum(iso)} ${t.months[monthIdx(iso)]}`;
}
/** „3 nov” */
export function shortDate(iso: string): string {
  return `${dayNum(iso)} ${t.monthsShort[monthIdx(iso)]}`;
}
export function monthYear(iso: string): string {
  return `${cap(t.months[monthIdx(iso)])} ${iso.slice(0, 4)}`;
}

// ---- ore ----
export function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
export function fromMin(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
export const endTime = (time: string, dur: number) => fromMin(toMin(time) + dur);

export function apptStart(date: string, time: string): Date {
  const d = fromISO(date);
  d.setHours(Math.floor(toMin(time) / 60), toMin(time) % 60, 0, 0);
  return d;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
