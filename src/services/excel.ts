import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Appointment, Procedure, Status } from '../types';
import { uid } from '../utils/date';
import { procedureColors } from '../theme';

const HEAD = ['Data', 'Ora', 'Durată (min)', 'Nume', 'Telefon', 'Procedură', 'Preț (lei)', 'Status', 'Observații', 'ID'];
const SHEET = 'Programări';

function buildBook(appts: Appointment[], procedures: Procedure[]) {
  const sorted = [...appts].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const rows = sorted.map((a) => [
    a.date, a.time, a.durationMin, a.clientName, a.phone || '', a.procedureName,
    a.price ?? '', a.status, a.notes || '', a.id,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([HEAD, ...rows]);
  ws['!cols'] = [12, 7, 12, 24, 14, 24, 11, 11, 30, 16].map((wch) => ({ wch }));
  const wp = XLSX.utils.aoa_to_sheet([
    ['Serviciu', 'Durată (min)', 'Preț (lei)'],
    ...procedures.map((p) => [p.name, p.durationMin, p.price ?? '']),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET);
  XLSX.utils.book_append_sheet(wb, wp, 'Servicii');
  return wb;
}

/** Salvează/partajează fișierul Excel cu toate programările. */
export async function exportExcel(appts: Appointment[], procedures: Procedure[]): Promise<number> {
  const wb = buildBook(appts, procedures);
  const name = `programari-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (Platform.OS === 'web') {
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const url = URL.createObjectURL(new Blob([out], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } else {
    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = (FileSystem.cacheDirectory || '') + name;
    await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Programări' });
  }
  return appts.length;
}

export interface ImportResult { appointments: Appointment[]; newProcedures: Procedure[] }

/** Alege un fișier Excel și îl transformă în programări. Întoarce null dacă s-a renunțat. */
export async function pickAndParseExcel(known: Procedure[]): Promise<ImportResult | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  let wb: XLSX.WorkBook;
  if (Platform.OS === 'web') {
    const buf = await (asset.file ? asset.file.arrayBuffer() : fetch(asset.uri).then((r) => r.arrayBuffer()));
    wb = XLSX.read(buf, { type: 'array' });
  } else {
    const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    wb = XLSX.read(b64, { type: 'base64' });
  }
  const ws = wb.Sheets[SHEET] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false, defval: '' }).slice(1);
  const procs = [...known];
  const newProcedures: Procedure[] = [];
  const now = new Date().toISOString();
  const appointments: Appointment[] = [];
  for (const r of rows) {
    const [date, time, dur, name, phone, procName, price, status, notes, id] = r.map((c: any) => String(c ?? '').trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time) || !name) continue;
    let proc = procs.find((p) => p.name.toLowerCase() === procName.toLowerCase());
    if (!proc && procName) {
      proc = { id: 'p-' + uid(), name: procName, durationMin: Number(dur) || 60, color: procedureColors[procs.length % procedureColors.length] };
      procs.push(proc);
      newProcedures.push(proc);
    }
    const p = price ? Number(price.replace(',', '.')) : NaN;
    appointments.push({
      id: id || uid(),
      clientName: name,
      phone: phone || undefined,
      date,
      time: time.padStart(5, '0'),
      durationMin: Number(dur) || 60,
      procedureId: proc?.id || 'p-necunoscut',
      procedureName: procName || 'Fără procedură',
      price: Number.isFinite(p) ? p : undefined,
      notes: notes || undefined,
      status: (['programat', 'finalizat', 'anulat'].includes(status) ? status : 'programat') as Status,
      createdAt: now,
      updatedAt: now,
    });
  }
  return { appointments, newProcedures };
}
