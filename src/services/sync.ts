import { Appointment, GoogleCalSettings, Procedure, SyncState } from '../types';

export interface ServerReply {
  serverTime: number;
  appointments: Appointment[];
  procedures: { list: Procedure[]; updatedAt: string };
  /** setarea Google Calendar păstrată în Sheet (lipsește la scripturile vechi) */
  calendar?: GoogleCalSettings;
  /** eroare la scrierea în Google Calendar (ex. script neautorizat pentru calendar) */
  calendarError?: string;
}

export class SyncError extends Error {
  constructor(public code: 'parola' | 'retea' | 'adresa' | 'altceva', msg?: string, public detail?: string) { super(msg || code); }
}

/** Acceptă și „adresa#parola” lipită într-un singur câmp. */
export function splitCode(url: string, key: string): { url: string; key: string } {
  const u = url.trim();
  if (u.includes('#') && !key.trim()) { const [a, ...b] = u.split('#'); return { url: a.trim(), key: b.join('#').trim() }; }
  return { url: u, key: key.trim() };
}

export async function callServer(
  sc: Pick<SyncState, 'url' | 'key' | 'lastPull'>,
  outgoing: Appointment[],
  procedures: { list: Procedure[]; updatedAt: string },
  extra?: { calendar?: GoogleCalSettings; test?: boolean },
): Promise<ServerReply> {
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(sc.url)) throw new SyncError('adresa');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  let text: string;
  try {
    const res = await fetch(sc.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // fără preflight CORS
      body: JSON.stringify({ key: sc.key, since: sc.lastPull, appointments: outgoing, procedures, ...(extra || {}) }),
      signal: ctl.signal,
    });
    text = await res.text();
  } catch (e) {
    throw new SyncError('retea', undefined, String(e));
  } finally {
    clearTimeout(timer);
  }
  let j: any;
  try { j = JSON.parse(text); } catch { throw new SyncError('adresa', undefined, text.slice(0, 80).replace(/\s+/g, ' ')); }
  if (!j.ok) throw new SyncError(j.error === 'parola' ? 'parola' : 'altceva', String(j.error));
  return j as ServerReply;
}

/** Cea mai recentă modificare câștigă. Întoarce lista nouă + rândurile care s-au schimbat. */
export function mergeAppointments(local: Appointment[], incoming: Appointment[]) {
  const map = new Map(local.map((a) => [a.id, a]));
  const changed: Appointment[] = [];
  for (const inc of incoming) {
    const cur = map.get(inc.id);
    if (!cur || inc.updatedAt > cur.updatedAt) {
      map.set(inc.id, { ...inc, deleted: inc.deleted || undefined, calendarEventId: cur?.calendarEventId });
      changed.push(inc);
    }
  }
  return { list: changed.length ? Array.from(map.values()) : local, changed };
}
