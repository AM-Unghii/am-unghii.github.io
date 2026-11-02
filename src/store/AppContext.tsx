import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AppData, Appointment, Procedure, Settings } from '../types';
import { emptyData, loadData, saveData } from './storage';
import { rescheduleReminders } from '../services/notifications';
import { removeEvent, syncEvent } from '../services/calendar';
import { callServer, mergeAppointments, splitCode, SyncError } from '../services/sync';
import { t } from '../i18n';
import { uid } from '../utils/date';

export type ApptInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'calendarEventId' | 'deleted'> & {
  id?: string;
  status?: Appointment['status'];
};

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'ok' | 'error';

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
  syncConnected: boolean;
  syncStatus: SyncStatus;
  syncError: string;
  lastSyncAt?: string;
  syncNow: () => Promise<void>;
  connectSync: (url: string, key: string) => Promise<string | null>;
  disconnectSync: () => void;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

const errText = (e: unknown) => {
  const c = e instanceof SyncError ? e.code : 'altceva';
  return c === 'parola' ? t.sync.errPass : c === 'retea' ? t.sync.errNet : c === 'adresa' ? t.sync.errUrl : t.sync.errOther;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const [syncError, setSyncError] = useState('');
  const ref = useRef(data);
  ref.current = data;
  const syncing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setSyncStatus(d.sync ? 'idle' : 'off');
      setLoaded(true);
    });
  }, []);

  // salvare automată la fiecare modificare
  useEffect(() => {
    if (loaded) saveData(data).then(() => setSavedAt(new Date().toISOString()));
  }, [data, loaded]);

  const live = useMemo(() => data.appointments.filter((a) => !a.deleted), [data.appointments]);

  // memento-uri
  useEffect(() => {
    if (loaded) rescheduleReminders(live, data.settings);
  }, [loaded, live, data.settings.reminderMinutes]);

  // ---------- sincronizare ----------
  const syncNow = useCallback(async () => {
    const start = ref.current;
    const sc = start.sync;
    if (!sc || syncing.current) return;
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      const startedAt = new Date().toISOString();
      const outgoing = start.appointments.filter((a) => a.updatedAt > sc.lastPush).map(({ calendarEventId, ...rest }) => rest as Appointment);
      const procs = { list: start.procedures, updatedAt: start.proceduresUpdatedAt };
      const res = await callServer(sc, outgoing, procs);

      const cur = ref.current;
      const merged = mergeAppointments(cur.appointments, res.appointments);
      setData((d) => {
        const m = mergeAppointments(d.appointments, res.appointments);
        const useProcs = res.procedures.updatedAt > d.proceduresUpdatedAt && res.procedures.list.length > 0;
        return {
          ...d,
          appointments: m.list,
          procedures: useProcs ? res.procedures.list : d.procedures,
          proceduresUpdatedAt: useProcs ? res.procedures.updatedAt : d.proceduresUpdatedAt,
          sync: d.sync ? { ...d.sync, lastPull: res.serverTime, lastPush: startedAt, lastSyncAt: new Date().toISOString() } : d.sync,
        };
      });

      // calendarul telefonului: aplică modificările venite de pe alte dispozitive
      if (cur.settings.syncDeviceCalendar) {
        for (const a of merged.changed) {
          const local = cur.appointments.find((x) => x.id === a.id);
          if (a.deleted) await removeEvent(local?.calendarEventId);
          else {
            const id = await syncEvent({ ...a, calendarEventId: local?.calendarEventId }, cur.settings.reminderMinutes);
            if (id !== local?.calendarEventId) setData((d) => ({ ...d, appointments: d.appointments.map((x) => (x.id === a.id ? { ...x, calendarEventId: id } : x)) }));
          }
        }
      }
      setSyncError('');
      setSyncStatus('ok');
    } catch (e) {
      setSyncError(errText(e));
      setSyncStatus('error');
    } finally {
      syncing.current = false;
    }
  }, []);

  const syncRef = useRef(syncNow);
  syncRef.current = syncNow;
  const scheduleSync = useCallback(() => {
    if (!ref.current.sync) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => syncRef.current(), 1500);
  }, []);

  const connected = !!data.sync;
  useEffect(() => {
    if (!loaded || !connected) return;
    syncRef.current();
    const iv = setInterval(() => syncRef.current(), 60000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') syncRef.current(); });
    return () => { clearInterval(iv); sub.remove(); };
  }, [loaded, connected]);

  const connectSync = useCallback(async (urlIn: string, keyIn: string) => {
    const { url, key } = splitCode(urlIn, keyIn);
    try {
      await callServer({ url, key, lastPull: Date.now() + 1e10 }, [], { list: [], updatedAt: '' }); // doar test
    } catch (e) {
      return e instanceof SyncError && e.code === 'retea' ? t.sync.errConnect : errText(e);
    }
    setData((d) => ({ ...d, sync: { url, key, lastPull: 0, lastPush: '' } }));
    setSyncStatus('idle');
    setTimeout(() => syncRef.current(), 100);
    return null;
  }, []);

  const disconnectSync = useCallback(() => {
    setData((d) => ({ ...d, sync: undefined }));
    setSyncStatus('off');
    setSyncError('');
  }, []);

  // ---------- programări ----------
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
      deleted: undefined,
    } as Appointment;
    patchAppt(a); // salvat imediat; calendarul se sincronizează după
    scheduleSync();
    const s = ref.current.settings;
    if (s.syncDeviceCalendar) {
      const eventId = await syncEvent(a, s.reminderMinutes);
      if (eventId !== a.calendarEventId) {
        a = { ...a, calendarEventId: eventId };
        patchAppt(a);
      }
    }
  }, [patchAppt, scheduleSync]);

  const setStatus = useCallback(async (id: string, status: Appointment['status']) => {
    const old = ref.current.appointments.find((x) => x.id === id);
    if (old) await saveAppointment({ ...old, status });
  }, [saveAppointment]);

  const deleteAppointment = useCallback(async (id: string) => {
    const old = ref.current.appointments.find((x) => x.id === id);
    if (!old) return;
    patchAppt({ ...old, deleted: true, calendarEventId: undefined, updatedAt: new Date().toISOString() });
    scheduleSync();
    if (old.calendarEventId) await removeEvent(old.calendarEventId);
  }, [patchAppt, scheduleSync]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const touchProcs = (d: AppData, procedures: Procedure[]): AppData => ({ ...d, procedures, proceduresUpdatedAt: new Date().toISOString() });

  const saveProcedure = useCallback((p: Procedure) => {
    setData((d) => touchProcs(d, d.procedures.some((x) => x.id === p.id) ? d.procedures.map((x) => (x.id === p.id ? p : x)) : [...d.procedures, p]));
    scheduleSync();
  }, [scheduleSync]);

  const deleteProcedure = useCallback((id: string) => {
    setData((d) => (d.procedures.length <= 1 ? d : touchProcs(d, d.procedures.filter((x) => x.id !== id))));
    scheduleSync();
  }, [scheduleSync]);

  const importAppointments = useCallback((list: Appointment[], newProcs: Procedure[]) => {
    let added = 0;
    let updated = 0;
    const byId = new Map(ref.current.appointments.map((a) => [a.id, a]));
    for (const a of list) {
      const old = byId.get(a.id);
      if (old) {
        if (!old.deleted) updated++; else added++;
        byId.set(a.id, { ...old, ...a, deleted: undefined, calendarEventId: old.calendarEventId, createdAt: old.createdAt });
      } else {
        added++;
        byId.set(a.id, a);
      }
    }
    setData((d) => {
      const procs = [...d.procedures, ...newProcs.filter((p) => !d.procedures.some((x) => x.id === p.id))];
      const out = { ...d, appointments: Array.from(byId.values()), procedures: procs };
      return newProcs.length ? { ...out, proceduresUpdatedAt: new Date().toISOString() } : out;
    });
    scheduleSync();
    return { added, updated };
  }, [scheduleSync]);

  const value = useMemo<Ctx>(
    () => ({
      loaded,
      appointments: live,
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
      syncConnected: connected,
      syncStatus,
      syncError,
      lastSyncAt: data.sync?.lastSyncAt,
      syncNow,
      connectSync,
      disconnectSync,
    }),
    [loaded, live, data.procedures, data.settings, data.sync?.lastSyncAt, connected, savedAt, syncStatus, syncError,
      saveAppointment, setStatus, deleteAppointment, updateSettings, saveProcedure, deleteProcedure, importAppointments, syncNow, connectSync, disconnectSync],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
