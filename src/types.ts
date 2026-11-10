export type Status = 'programat' | 'finalizat' | 'anulat';

/** un preț și data de la care e valabil („” = dintotdeauna) */
export interface PricePoint {
  /** YYYY-MM-DD sau gol */
  from: string;
  price: number;
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
}

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
