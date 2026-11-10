import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Input, Label, Sheet } from './ui';
import { DatePicker } from './DatePicker';
import { useApp } from '../store/AppContext';
import { Appointment } from '../types';
import { colors, font, radius } from '../theme';
import { t } from '../i18n';
import { longDate, todayISO } from '../utils/date';
import { overlapping, parseTime } from '../utils/appts';

export function confirmBox(title: string, body: string, ok: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${body}`)) onOk();
  } else {
    Alert.alert(title, body, [{ text: t.cancel, style: 'cancel' }, { text: ok, style: 'destructive', onPress: onOk }]);
  }
}

/**
 * Reprogramare în doi pași: mai întâi apare calendarul (data nouă), apoi ora.
 * `appt` = programarea de mutat; null = închis.
 */
export function RescheduleFlow({ appt, onClose, onDone }: { appt: Appointment | null; onClose: () => void; onDone?: () => void }) {
  const { appointments, rescheduleAppointment } = useApp();
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [date, setDate] = useState(appt?.date || todayISO());
  const [time, setTime] = useState(appt?.time || '');
  const [err, setErr] = useState('');
  const picked = useRef(false);

  useEffect(() => {
    if (!appt) return;
    picked.current = false; setStep('date'); setDate(appt.date); setTime(appt.time); setErr('');
  }, [appt?.id]);

  if (!appt) return null;
  const parsed = parseTime(time);
  const clash = parsed ? overlapping(appointments, date, parsed, appt.durationMin, appt.id)[0] : undefined;

  const apply = async () => {
    if (!parsed) { setErr(t.list.needTime); return; }
    await rescheduleAppointment(appt.id, date, parsed);
    onClose();
    onDone?.();
  };

  return (
    <>
      <DatePicker visible={step === 'date'} value={date} title={t.rs.pickDate}
        onPick={(d) => { picked.current = true; setDate(d); setStep('time'); }}
        onClose={() => { if (!picked.current) onClose(); picked.current = false; }} />
      <Sheet visible={step === 'time'} onClose={onClose} title={t.rs.pickTitle}>
        <Text style={st.who}>{appt.clientName} · {appt.procedureName}</Text>
        <Text style={st.was}>{longDate(appt.date)}, {appt.time}</Text>
        <Label>{t.rs.pickDate}</Label>
        <Btn kind="soft" icon="calendar" label={`${longDate(date)} ${date.slice(0, 4)}`} onPress={() => { picked.current = false; setStep('date'); }} />
        <Label>{t.rs.pickTime}</Label>
        <Input value={time} onChangeText={(v) => { setTime(v); setErr(''); }} placeholder="14:30" keyboardType="numbers-and-punctuation"
          onSubmitEditing={apply} autoFocus />
        {err ? <Text style={st.err}>{err}</Text> : null}
        {clash ? (
          <View style={st.warn}><Ionicons name="warning" size={18} color={colors.warn} /><Text style={st.warnText}>{t.rs.overlapAt(`${clash.clientName} (${clash.time})`)}</Text></View>
        ) : null}
        <Btn label={t.rs.apply} icon="swap-horizontal" onPress={apply} style={{ marginTop: 22 }} />
      </Sheet>
    </>
  );
}

/** Cele 3 acțiuni: Reprogramează / Anulează / Șterge. Folosit în tabel și în fereastra programării. */
export function ApptActions({ a, compact, onChanged }: { a: Appointment; compact?: boolean; onChanged?: () => void }) {
  const { setStatus, deleteAppointment } = useApp();
  const [moving, setMoving] = useState(false);
  const cancelled = a.status === 'anulat';
  return (
    <>
      <View style={[st.row, compact && { gap: 6 }]}>
        <Btn kind="soft" icon="calendar-outline" label={t.rs.action} onPress={() => setMoving(true)} style={compact ? st.small : undefined} />
        {cancelled ? (
          <Btn kind="soft" icon="refresh" label={t.rs.restore} onPress={async () => { await setStatus(a.id, 'programat'); onChanged?.(); }} style={compact ? st.small : undefined} />
        ) : (
          <Btn kind="ghost" icon="close-circle-outline" label={t.rs.cancelAppt}
            onPress={() => confirmBox(t.rs.cancelTitle, t.rs.cancelBody, t.rs.cancelYes, async () => { await setStatus(a.id, 'anulat'); onChanged?.(); })}
            style={compact ? st.small : undefined} />
        )}
        <Btn kind="danger" icon="trash-outline" label={t.rs.deleteAppt}
          onPress={() => confirmBox(t.rs.deleteTitle, t.rs.deleteBody, t.rs.deleteYes, async () => { await deleteAppointment(a.id); onChanged?.(); })}
          style={compact ? st.small : undefined} />
      </View>
      <RescheduleFlow appt={moving ? a : null} onClose={() => setMoving(false)} onDone={onChanged} />
    </>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  small: { },
  who: { fontSize: 18, ...font.w700, color: colors.ink },
  was: { fontSize: 14, color: colors.muted, marginTop: 2, ...font.w600 },
  err: { color: colors.danger, marginTop: 6, ...font.w600, fontSize: 15 },
  warn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.warnSoft, padding: 12, borderRadius: radius.md, marginTop: 10 },
  warnText: { flex: 1, color: '#7A5600', ...font.w600, fontSize: 14 },
});
