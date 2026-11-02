import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppData, Appointment, Procedure, Settings } from '../types';
import { emptyData, loadData, saveData } from './storage';
import { rescheduleReminders } from '../services/notifications';
import { removeEvent, syncEvent } from '../services/calendar';
import { uid } from '../utils/date';

export type ApptInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'calendarEventId'> & {
  id?: string;
  status?: Appointment['status'];
};

interface Ctx {
  loaded: boolean;
  appointments: Appointment[];
  procedures: Procedure[];
  settings: Settings;
  savedAt: string;
  saveAppointment: (input: ApptInput) => Promise<void>;
  setStatus: (id: string, status: Appointment['status']) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  saveProcedure: (p: Procedure) => void;
  deleteProcedure: (id: string) => void;
  importAppointments: (list: Appointment[], newProcs: Procedure[]) => { added: number; updated: number };
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const ref = useRef(data);
  ref.current = data;

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setLoaded(true);
    });
  }, []);

  // salvare automată la fiecare modificare
  useEffect(() => {
    if (loaded) saveData(data).then(() => setSavedAt(new Date().toISOString()));
  }, [data, loaded]);

  // memento-uri
  useEffect(() => {
    if (loaded) rescheduleReminders(data.appointments, data.settings);
  }, [loaded, data.appointments, data.settings.reminderMinutes]);

  const patchAppt = useCallback((a: Appointment) => {
    setData((d) => ({
      ...d,
      appointments: d.appointments.some((x) => x.id === a.id)
        ? d.appointments.map((x) => (x.id === a.id ? a : x))
        : [...d.appointments, a],
    }));
  }, []);

  const saveAppointment = useCallback(async (input: ApptInput) => {
    const now = new Date().toISOString();
    const old = input.id ? ref.current.appointments.find((x) => x.id === input.id) : undefined;
    let a: Appointment = {
      ...old,
      ...input,
      id: old?.id ?? input.id ?? uid(),
      status: input.status ?? old?.status ?? 'programat',
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
    } as Appointment;
    patchAppt(a); // salvat imediat; calendarul se sincronizează după
    const s = ref.current.settings;
    if (s.syncDeviceCalendar) {
      const eventId = await syncEvent(a, s.reminderMinutes);
      if (eventId !== a.calendarEventId) {
        a = { ...a, calendarEventId: eventId };
        patchAppt(a);
      }
    }
  }, [patchAppt]);

  const setStatus = useCallback(async (id: string, status: Appointment['status']) => {
    const old = ref.current.appointments.find((x) => x.id === id);
    if (old) await saveAppointment({ ...old, status });
  }, [saveAppointment]);

  const deleteAppointment = useCallback(async (id: string) => {
    const old = ref.current.appointments.find((x) => x.id === id);
    setData((d) => ({ ...d, appointments: d.appointments.filter((x) => x.id !== id) }));
    if (old?.calendarEventId) await removeEvent(old.calendarEventId);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const saveProcedure = useCallback((p: Procedure) => {
    setData((d) => ({
      ...d,
      procedures: d.procedures.some((x) => x.id === p.id)
        ? d.procedures.map((x) => (x.id === p.id ? p : x))
        : [...d.procedures, p],
    }));
  }, []);

  const deleteProcedure = useCallback((id: string) => {
    setData((d) => (d.procedures.length <= 1 ? d : { ...d, procedures: d.procedures.filter((x) => x.id !== id) }));
  }, []);

  const importAppointments = useCallback((list: Appointment[], newProcs: Procedure[]) => {
    let added = 0;
    let updated = 0;
    const cur = ref.current;
    const byId = new Map(cur.appointments.map((a) => [a.id, a]));
    for (const a of list) {
      if (byId.has(a.id)) {
        updated++;
        byId.set(a.id, { ...byId.get(a.id)!, ...a, calendarEventId: byId.get(a.id)!.calendarEventId, createdAt: byId.get(a.id)!.createdAt });
      } else {
        added++;
        byId.set(a.id, a);
      }
    }
    setData((d) => ({
      ...d,
      appointments: Array.from(byId.values()),
      procedures: [...d.procedures, ...newProcs.filter((p) => !d.procedures.some((x) => x.id === p.id))],
    }));
    return { added, updated };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      loaded,
      appointments: data.appointments,
      procedures: data.procedures,
      settings: data.settings,
      savedAt,
      saveAppointment,
      setStatus,
      deleteAppointment,
      updateSettings,
      saveProcedure,
      deleteProcedure,
      importAppointments,
    }),
    [loaded, data, savedAt, saveAppointment, setStatus, deleteAppointment, updateSettings, saveProcedure, deleteProcedure, importAppointments],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
