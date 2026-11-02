export type Status = 'programat' | 'finalizat' | 'anulat';

export interface Procedure {
  id: string;
  name: string;
  durationMin: number;
  /** preț implicit (opțional) */
  price?: number;
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
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'zi' | '3zile' | 'saptamana' | 'luna' | 'an' | 'custom';

export interface Settings {
  usePrices: boolean;
  /** minute înainte de programare; null = fără memento */
  reminderMinutes: number | null;
  syncDeviceCalendar: boolean;
  defaultView: ViewMode;
  dayStartHour: number;
  dayEndHour: number;
}

export interface AppData {
  version: 1;
  appointments: Appointment[];
  procedures: Procedure[];
  settings: Settings;
  savedAt: string;
}
