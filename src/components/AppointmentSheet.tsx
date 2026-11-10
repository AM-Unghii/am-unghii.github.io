import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Chip, Input, Label, Row, Segmented, Sheet } from './ui';
import { DatePicker } from './DatePicker';
import { ApptActions } from './ApptActions';
import { PeriodSheet } from './PeriodSheet';
import { useApp } from '../store/AppContext';
import { Appointment } from '../types';
import { colors, radius, font, tint } from '../theme';
import { t } from '../i18n';
import { endTime, longDate, toMin, todayISO } from '../utils/date';
import { openGoogleCalendar } from '../services/calendar';
import { priceOn } from '../utils/prices';
import { apptName, isPersonalProc, overlapping, withPersonalFallback } from '../utils/appts';
import { apptSub, procColor } from './ApptRow';

export interface SheetTarget {
  /** programare existentă (modificare) */
  appt?: Appointment;
  /** valori inițiale pentru programare nouă */
  date?: string;
  time?: string;
  /** programare personală nouă */
  personal?: boolean;
}

const MINUTES = ['00', '15', '30', '45'];
const DURATIONS = [30, 45, 60, 90, 120, 150];

function confirm(title: string, body: string, ok: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${body}`)) onOk();
  } else {
    Alert.alert(title, body, [{ text: t.cancel, style: 'cancel' }, { text: ok, style: 'destructive', onPress: onOk }]);
  }
}

export function AppointmentSheet({ target, onClose }: { target: SheetTarget | null; onClose: () => void }) {
  const { appointments, procedures: realProcs, settings, saveAppointment, deleteAppointment, setStatus } = useApp();
  const editing = target?.appt;
  const procedures = useMemo(() => withPersonalFallback(realProcs), [realProcs]);
  const [period, setPeriod] = useState(false);
  const [personal, setPersonal] = useState(false);
  const [report, setReport] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [procId, setProcId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState('00');
  const [dur, setDur] = useState(60);
  const [price, setPrice] = useState('');
  /** ultimul preț completat automat; dacă prețul nu a fost schimbat de mână, îl refacem la schimbarea serviciului/datei */
  const [autoPrice, setAutoPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [pickDate, setPickDate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    setError('');
    const a = target.appt;
    if (a) {
      setPersonal(!!a.personal); setReport(a.report ?? true);
      setName(a.clientName); setPhone(a.phone || ''); setProcId(a.procedureId); setDate(a.date);
      setHour(Number(a.time.slice(0, 2))); setMinute(a.time.slice(3)); setDur(a.durationMin);
      setPrice(a.price !== undefined ? String(a.price) : ''); setAutoPrice(a.price !== undefined ? '\u0000' : ''); setNotes(a.notes || '');
    } else {
      const wantPersonal = !!target.personal;
      const p = procedures.find((x) => isPersonalProc(x) === wantPersonal) || procedures[0];
      setPersonal(wantPersonal); setReport(p.report ?? true);
      setName(''); setPhone(''); setProcId(p.id); setDate(target.date || todayISO());
      const tm = target.time || '10:00';
      setHour(Number(tm.slice(0, 2))); setMinute(tm.slice(3)); setDur(p.durationMin);
      const auto = settings.usePrices ? priceOn(p, target.date || todayISO()) : undefined;
      setPrice(auto !== undefined ? String(auto) : ''); setAutoPrice(auto !== undefined ? String(auto) : ''); setNotes('');
    }
  }, [target]);

  const time = `${String(hour).padStart(2, '0')}:${minute}`;
  const proc = procedures.find((p) => p.id === procId);

  // programările personale contează și ele: în acel timp nu poți lucra
  const clashes = useMemo(() => overlapping(appointments, date, time, dur, editing?.id), [appointments, date, time, dur, editing]);
  const overlap = clashes[0];
  /** tot ce mai e în ziua aleasă (cliente + programările tale), ca să vezi când ești liberă */
  const dayList = useMemo(
    () => appointments.filter((x) => x.id !== editing?.id && x.date === date && x.status !== 'anulat').sort((x, y) => x.time.localeCompare(y.time)),
    [appointments, date, editing],
  );
  const kindProcs = procedures.filter((p) => isPersonalProc(p) === personal);

  /** prețul serviciului valabil la data programării (doar dacă prețul nu a fost scris de mână) */
  const refillPrice = (pid: string, d: string) => {
    if (!settings.usePrices || price !== autoPrice) return;
    const v = priceOn(procedures.find((x) => x.id === pid), d);
    const str = v !== undefined ? String(v) : '';
    setPrice(str); setAutoPrice(str);
  };

  const pickProc = (id: string) => {
    setProcId(id);
    const p = procedures.find((x) => x.id === id);
    if (p) { setDur(p.durationMin); if (personal) setReport(p.report ?? true); }
    refillPrice(id, date);
  };

  const pickDate2 = (d: string) => { setDate(d); refillPrice(procId, d); };

  const pickKind = (k: 'client' | 'personal') => {
    const want = k === 'personal';
    if (want === personal) return;
    setPersonal(want);
    setError('');
    const p = procedures.find((x) => isPersonalProc(x) === want);
    if (!p) return;
    setProcId(p.id); setDur(p.durationMin); setReport(p.report ?? true);
    if (settings.usePrices && price === autoPrice) {
      const v = priceOn(p, date);
      const str = v !== undefined ? String(v) : '';
      setPrice(str); setAutoPrice(str);
    }
  };

  const save = async () => {
    if (!name.trim() && !personal) { setError(t.nameRequired); return; }
    const pr = price.trim() ? Number(price.replace(',', '.')) : undefined;
    await saveAppointment({
      id: editing?.id,
      clientName: name.trim(),
      phone: personal ? undefined : phone.trim() || undefined,
      personal: personal || undefined,
      report: personal ? report : undefined,
      date, time, durationMin: dur,
      procedureId: procId,
      procedureName: proc?.name || editing?.procedureName || '',
      price: pr !== undefined && Number.isFinite(pr) ? pr : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  if (!target) return null;
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 06..23

  return (
    <>
      <PeriodSheet visible={period} date={date} onClose={() => setPeriod(false)} onDone={() => { setPeriod(false); onClose(); }} />
      <Sheet visible={!!target && !period} onClose={onClose}
        title={personal ? (editing ? t.personal.editTitle : t.personal.newTitle) : editing ? t.editAppt : t.newAppt}>
        <Segmented items={[{ key: 'client', label: t.personal.forClient }, { key: 'personal', label: t.personal.mine }]}
          value={personal ? 'personal' : 'client'} onChange={pickKind} />

        <Label>{personal ? t.personal.where : t.name}</Label>
        <Input value={name} onChangeText={(v) => { setName(v); setError(''); }} placeholder={personal ? t.personal.wherePh : t.namePh}
          autoCapitalize="words" autoFocus={!editing && !personal} />
        {error ? <Text style={st.err}>{error}</Text> : null}

        <Label>{personal ? t.personal.what : t.procedure}</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {kindProcs.map((p) => (
            <Chip key={p.id} label={p.name} color={p.color} icon={personal ? 'person' : undefined} active={p.id === procId} onPress={() => pickProc(p.id)} />
          ))}
        </Row>
        {personal && !editing ? <Btn kind="soft" icon="calendar-outline" label={t.period.open} onPress={() => setPeriod(true)} style={{ marginTop: 10 }} /> : null}
        {personal && !realProcs.some(isPersonalProc) ? <Text style={st.hint}>{t.personal.moreHint}</Text> : null}

        <Label>{t.date}</Label>
        <Pressable onPress={() => setPickDate(true)} style={st.dateBtn} accessibilityRole="button">
          <Ionicons name="calendar" size={22} color={colors.primary} />
          <Text style={st.dateText}>{longDate(date)}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.muted} />
        </Pressable>

        <Label>{t.time}: {time} – {endTime(time, dur)}</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {hours.map((h) => (
            <Chip key={h} small label={String(h).padStart(2, '0')} active={h === hour} onPress={() => setHour(h)} />
          ))}
        </Row>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }}>
          {MINUTES.map((m) => (
            <Chip key={m} label={`:${m}`} active={m === minute} onPress={() => setMinute(m)} />
          ))}
        </Row>
        {overlap ? (
          <View style={st.warn}>
            <Ionicons name="warning" size={18} color={colors.warn} />
            <Text style={st.warnText}>{overlap.personal ? t.overlapPersonal(apptName(overlap), overlap.time) : t.overlap(overlap.clientName, overlap.time)}</Text>
          </View>
        ) : null}

        <Label>{t.personal.dayList}</Label>
        {dayList.length === 0 ? <Text style={st.hint}>{t.personal.dayFree}</Text> : (
          <View style={st.day}>
            {dayList.map((x) => {
              const c = procColor(x, realProcs);
              const hit = clashes.some((y) => y.id === x.id);
              return (
                <View key={x.id} style={[st.dayRow, x.personal && st.dayPersonal, hit && { backgroundColor: colors.warnSoft }]}>
                  <View style={[st.dayBar, { backgroundColor: c }]} />
                  <Text style={st.dayTime}>{x.time}–{endTime(x.time, x.durationMin)}</Text>
                  {x.personal ? <Ionicons name="person" size={13} color={c} /> : null}
                  <Text style={st.dayName} numberOfLines={1}>{apptName(x)} <Text style={st.daySub}>· {apptSub(x)}</Text></Text>
                </View>
              );
            })}
          </View>
        )}

        <Label>{t.duration}</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {DURATIONS.map((d) => (
            <Chip key={d} small label={d >= 60 && d % 60 === 0 ? `${d / 60} h` : `${d} ${t.min}`} active={d === dur} onPress={() => setDur(d)} />
          ))}
        </Row>

        {settings.usePrices ? (
          <>
            <Label>{personal ? t.personal.price : t.price}</Label>
            <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={`ex. 120 ${t.lei}`} />
            {personal ? (
              <Row style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={st.swLbl}>{t.personal.report}</Text>
                  <Text style={st.hint}>{t.personal.reportHint}</Text>
                </View>
                <Switch value={report} onValueChange={setReport} trackColor={{ true: colors.primary, false: '#DDD3DF' }} />
              </Row>
            ) : null}
          </>
        ) : null}

        {!personal ? (
          <>
            <Label>{t.phone}</Label>
            <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="07xx xxx xxx" />
          </>
        ) : null}

        <Label>{t.notes}</Label>
        <Input value={notes} onChangeText={setNotes} multiline style={{ minHeight: 76, paddingTop: 14, textAlignVertical: 'top' }} />

        <Btn label={t.save} icon="checkmark" onPress={save} style={{ marginTop: 24 }} />

        {editing?.reschedules?.length ? (
          <View style={{ marginTop: 18 }}>
            <Label>{t.rs.history}</Label>
            {editing.reschedules.map((r, i) => <Text key={i} style={st.hist}>{r.from} → {r.to}</Text>)}
          </View>
        ) : null}

        {editing ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            {editing.phone ? <Btn kind="soft" icon="call" label={`${t.call} ${editing.phone}`} onPress={() => Linking.openURL(`tel:${editing.phone}`)} /> : null}
            <Btn kind="soft" icon="logo-google" label={t.addGoogle} onPress={() => openGoogleCalendar(editing)} />
            {editing.status === 'programat' ? (
              <Btn kind="soft" icon="checkmark-done" label={t.markDone} onPress={async () => { await setStatus(editing.id, 'finalizat'); onClose(); }} />
            ) : editing.status === 'finalizat' ? (
              <Btn kind="soft" icon="refresh" label={t.restore} onPress={async () => { await setStatus(editing.id, 'programat'); onClose(); }} />
            ) : null}
            <ApptActions a={editing} onChanged={onClose} />
          </View>
        ) : null}
      </Sheet>
      <DatePicker visible={pickDate} value={date} onPick={pickDate2} onClose={() => setPickDate(false)} />
    </>
  );
}

const st = StyleSheet.create({
  hist: { fontSize: 14, color: colors.ink, ...font.w600, marginTop: 2 },
  err: { color: colors.danger, marginTop: 6, ...font.w600, fontSize: 15 },
  dateBtn: {
    minHeight: 54, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dateText: { flex: 1, fontSize: 17, ...font.w600, color: colors.ink },
  warn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.warnSoft, padding: 12, borderRadius: radius.md, marginTop: 10 },
  warnText: { flex: 1, color: '#7A5600', ...font.w600, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 6, ...font.reg },
  swLbl: { fontSize: 16, color: colors.ink, ...font.w600 },
  day: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingRight: 10, borderTopWidth: 1, borderTopColor: colors.line, marginTop: -1 },
  dayPersonal: { backgroundColor: tint(colors.muted, 0.06) },
  dayBar: { width: 4, alignSelf: 'stretch' },
  dayTime: { fontSize: 13, color: colors.ink, ...font.w800, minWidth: 92 },
  dayName: { flex: 1, fontSize: 14, color: colors.ink, ...font.w600 },
  daySub: { color: colors.muted, ...font.reg },
});
