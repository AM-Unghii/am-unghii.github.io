import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Procedure, Settings } from '../types';
import { procedureColors } from '../theme';

const KEY = 'amu:v1:data';
const KEY_BACKUP = 'amu:v1:backup';

export const defaultProcedures: Procedure[] = [
  { id: 'p-mani', name: 'Manichiură', durationMin: 60, color: procedureColors[0] },
  { id: 'p-pedi', name: 'Pedichiură', durationMin: 60, color: procedureColors[1] },
  { id: 'p-gel', name: 'Gel / semipermanent', durationMin: 90, color: procedureColors[2] },
  { id: 'p-mp', name: 'Manichiură + pedichiură', durationMin: 120, color: procedureColors[3] },
];

export const defaultSettings: Settings = {
  usePrices: false,
  reminderMinutes: 60,
  syncDeviceCalendar: false,
  defaultView: 'saptamana',
  dayStartHour: 8,
  dayEndHour: 20,
};

export function emptyData(): AppData {
  return {
    version: 1,
    appointments: [],
    procedures: defaultProcedures,
    proceduresUpdatedAt: '1970-01-01T00:00:00.000Z',
    settings: defaultSettings,
    savedAt: new Date().toISOString(),
  };
}

function normalize(raw: any): AppData | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.appointments)) return null;
  return {
    version: 1,
    appointments: raw.appointments,
    procedures: Array.isArray(raw.procedures) && raw.procedures.length ? raw.procedures : defaultProcedures,
    proceduresUpdatedAt: raw.proceduresUpdatedAt || '1970-01-01T00:00:00.000Z',
    sync: raw.sync || undefined,
    settings: { ...defaultSettings, ...(raw.settings || {}) },
    savedAt: raw.savedAt || new Date().toISOString(),
  };
}

async function tryRead(key: string): Promise<AppData | null> {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? normalize(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

/** Citește datele; dacă fișierul principal e stricat, folosește copia de siguranță. */
export async function loadData(): Promise<AppData> {
  const main = await tryRead(KEY);
  if (main) return main;
  const backup = await tryRead(KEY_BACKUP);
  return backup ?? emptyData();
}

let lastGood: string | null = null;

/** Salvează; păstrează mereu versiunea anterioară ca și copie de siguranță. */
export async function saveData(data: AppData): Promise<void> {
  const json = JSON.stringify({ ...data, savedAt: new Date().toISOString() });
  try {
    if (lastGood === null) lastGood = await AsyncStorage.getItem(KEY);
    if (lastGood) await AsyncStorage.setItem(KEY_BACKUP, lastGood);
    await AsyncStorage.setItem(KEY, json);
    lastGood = json;
  } catch (e) {
    console.warn('Salvare eșuată', e);
  }
}
