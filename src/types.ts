export type Status = 'programat' | 'finalizat' | 'anulat';

/** un preț și data de la care e valabil („” = dintotdeauna) */
export interface PricePoint {
  /** YYYY-MM-DD sau gol */
  from: string;
  price: number;
  /** YYYY-MM-DD: ziua în care a fost introdus prețul (pentru istoric) */
  changedAt?: string;
}

export interface Procedure {
  id: string;
  name: string;
  durationMin: number;
  /** preț implicit (opțional) = prețul de azi; păstrat pentru compatibilitate (Excel, versiuni vechi) */
  price?: number;
  /** istoricul prețurilor; programările își păstrează propriul preț, deci schimbarea nu atinge trecutul */
  prices?: PricePoint[];
  color: string;
  /** „client” = serviciu pentru cliente (încasare, implicit); „personal” = programare a mea (preț = cheltuială) */
  kind?: ProcKind;
  /** doar la „personal”: prețul intră în rapoarte ca cheltuială (implicit da) */
  report?: boolean;
}

export type ProcKind = 'client' | 'personal';

/** o mutare a programării: de unde, unde și când s-a făcut */
export interface Reschedule {
  /** „YYYY-MM-DD HH:mm” înainte de mutare */
  from: string;
  /** „YYYY-MM-DD HH:mm” după mutare */
  to: string;
  /** momentul mutării (ISO) */
  at: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  phone?: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  durationMin: number;
  procedureId: string;
  /** copie a numelui, ca programările vechi să rămână corecte dacă serviciul e șters */
  procedureName: string;
  price?: number;
  notes?: string;
  status: Status;
  /** istoricul mutărilor (pentru rapoarte: câte au fost reprogramate) */
  reschedules?: Reschedule[];
  /** programare personală (a mea, nu a unei cliente); copie din serviciu, ca să rămână corectă dacă serviciul e șters */
  personal?: boolean;
  /** doar la personale: prețul intră în rapoarte ca cheltuială */
  report?: boolean;
  calendarEventId?: string;
  /** șters (rămâne ca „pietre de mormânt” ca ștergerea să se sincronizeze) */
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'zi' | '3zile' | 'saptamana' | 'luna' | 'an' | 'custom';

/** Unde se creează notificările: aplicația, calendarul telefonului sau Google Calendar prin scriptul de sincronizare */
export type NotifyVia = 'app' | 'device' | 'google';

/** Setarea pentru Google Calendar, comună tuturor dispozitivelor (se păstrează și în Google Sheet) */
export interface GoogleCalSettings {
  on: boolean;
  /** e-mailul / id-ul calendarului; gol = calendarul principal al contului scriptului */
  calendarId: string;
  /** trimite și e-mail înainte de programare */
  email: boolean;
  reminder: number | null;
  updatedAt: string;
}

export interface Settings {
  usePrices: boolean;
  /** minute înainte de programare; null = fără memento */
  reminderMinutes: number | null;
  notifyVia: NotifyVia;
  /** calendarul din telefon ales (gol = automat) */
  deviceCalendarId?: string;
  googleCal: GoogleCalSettings;
  defaultView: ViewMode;
  dayStartHour: number;
  dayEndHour: number;
  /** fundalul iconiței aplicației */
  logoBg: LogoBg;
  /** forma iconiței (contează doar cu fundal alb) */
  logoShape: LogoShape;
  /** tabul „Programări”: sortarea și filtrele alese */
  list?: ListPrefs;
}

export type ListSort = 'data' | 'dataDesc' | 'nume' | 'procedura' | 'adaugate';
export type ListPeriod = 'viitoare' | 'azi' | 'saptamana' | 'trecute' | 'toate';
export type ListStatus = 'toate' | 'programat' | 'finalizat' | 'anulat' | 'reprogramate';
export type ListKind = 'toate' | 'cliente' | 'personale';
export interface ListPrefs { sort: ListSort; period: ListPeriod; status: ListStatus; kind?: ListKind }

export type LogoBg = 'alb' | 'transparent';
export type LogoShape = 'patrat' | 'rotund';

export interface SyncState {
  url: string;
  key: string;
  lastPull: number;
  lastPush: string;
  lastSyncAt?: string;
}

export interface AppData {
  version: 1;
  appointments: Appointment[];
  procedures: Procedure[];
  proceduresUpdatedAt: string;
  sync?: SyncState;
  settings: Settings;
  savedAt: string;
}
