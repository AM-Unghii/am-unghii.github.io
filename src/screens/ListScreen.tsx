import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { Appointment, ListPrefs } from '../types';
import { colors, font, radius, shadow, tint } from '../theme';
import { t } from '../i18n';
import { dateWithYear, endTime, longDate, todayISO } from '../utils/date';
import { apptName, defaultListPrefs, filterAppts, isPersonalProc, overlapping, parseTime, rescheduleCount, sortAppts, withPersonalFallback } from '../utils/appts';
import { priceOn } from '../utils/prices';
import { Card, Chip, Hero, Input, Label, Row, useWide } from '../components/ui';
import { DatePicker } from '../components/DatePicker';
import { ApptActions } from '../components/ApptActions';
import { AppointmentSheet } from '../components/AppointmentSheet';
import { apptSub, procColor } from '../components/ApptRow';

export function ListScreen() {
  const { appointments, procedures: realProcs, settings, saveAppointment, updateSettings } = useApp();
  const procedures = useMemo(() => withPersonalFallback(realProcs), [realProcs]);
  const wide = useWide();
  const prefs: ListPrefs = { ...defaultListPrefs, ...(settings.list || {}) };
  const setPrefs = (p: Partial<ListPrefs>) => updateSettings({ list: { ...prefs, ...p } });
  const today = todayISO();

  // rândul de adăugare rapidă
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [procId, setProcId] = useState(procedures[0]?.id || '');
  const [err, setErr] = useState('');
  const [pickDate, setPickDate] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Appointment | null>(null);
  const timeRef = React.useRef<any>(null);
  const nameRef = React.useRef<any>(null);

  const proc = procedures.find((p) => p.id === procId) || procedures[0];
  const parsed = parseTime(time);
  const clash = parsed && proc ? overlapping(appointments, date, parsed, proc.durationMin)[0] : undefined;
  const personal = isPersonalProc(proc);

  const add = async () => {
    if (!name.trim() && !personal) { setErr(t.list.needName); nameRef.current?.focus?.(); return; }
    if (!parsed) { setErr(t.list.needTime); timeRef.current?.focus?.(); return; }
    if (!proc) return;
    const price = settings.usePrices ? priceOn(proc, date) : undefined;
    await saveAppointment({
      clientName: name.trim(), date, time: parsed, durationMin: proc.durationMin,
      procedureId: proc.id, procedureName: proc.name, price,
      personal: personal || undefined, report: personal ? proc.report ?? true : undefined,
    });
    setName(''); setTime(''); setErr('');
    nameRef.current?.focus?.();
  };

  const rows = useMemo(
    () => sortAppts(filterAppts(appointments, prefs, today, search), prefs.sort),
    [appointments, prefs.sort, prefs.period, prefs.status, prefs.kind, today, search],
  );

  const opts = <K extends keyof ListPrefs>(key: K, label: string, map: Record<string, string>) => (
    <View style={{ marginTop: 10 }}>
      <Text style={st.fLbl}>{label}</Text>
      <Row style={{ flexWrap: 'wrap', marginTop: 6 }}>
        {Object.keys(map).map((k) => <Chip key={k} small label={map[k]} active={prefs[key] === k} onPress={() => setPrefs({ [key]: k } as any)} />)}
      </Row>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
        <Hero title={t.list.title} subtitle={t.list.subtitle} />
        <View style={[{ padding: 16 }, wide && { paddingHorizontal: 24, maxWidth: 1100, width: '100%', alignSelf: 'center' }]}>

          {/* rând nou, ca într-o aplicație de taskuri: Enter îl pune în listă */}
          <Card style={{ borderColor: tint(colors.primary, 0.3), borderWidth: 1.5 }}>
            <Row style={{ gap: 8, flexWrap: 'wrap', alignItems: 'stretch' }}>
              <Input ref={nameRef} value={name} onChangeText={(v) => { setName(v); setErr(''); }} placeholder={personal ? t.personal.where : t.list.namePh} autoCapitalize="words"
                style={{ flexGrow: 2, flexBasis: 160 }} onSubmitEditing={() => (parsed ? add() : timeRef.current?.focus?.())} accessibilityLabel={personal ? t.personal.where : t.list.namePh} blurOnSubmit={false} />
              <Pressable onPress={() => setPickDate(true)} style={st.dateBtn} accessibilityRole="button" accessibilityLabel={t.list.datePh}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text style={st.dateTxt}>{date === today ? t.today : dateWithYear(date)}</Text>
              </Pressable>
              <Input ref={timeRef} value={time} onChangeText={(v) => { setTime(v); setErr(''); }} placeholder={t.list.timePh}
                keyboardType="numbers-and-punctuation" style={{ flexGrow: 1, flexBasis: 110 }} onSubmitEditing={add} />
              <Pressable onPress={add} style={st.addBtn} accessibilityRole="button" accessibilityLabel={t.list.add}>
                <Ionicons name="add" size={24} color="#fff" />
              </Pressable>
            </Row>
            <Row style={{ flexWrap: 'wrap', marginTop: 10 }}>
              {procedures.map((p) => <Chip key={p.id} small label={p.name} color={p.color} icon={isPersonalProc(p) ? 'person' : undefined} active={p.id === procId} onPress={() => setProcId(p.id)} />)}
            </Row>
            {err ? <Text style={st.err}>{err}</Text> : <Text style={st.hint}>{t.list.addHint}</Text>}
            {clash ? <Text style={st.clash}>{clash.personal ? t.overlapPersonal(apptName(clash), clash.time) : t.overlap(clash.clientName, clash.time)}</Text> : null}
          </Card>

          <View style={{ marginTop: 14 }}>
            <Input value={search} onChangeText={setSearch} placeholder={t.list.search} />
            {opts('sort', t.list.sortLbl, t.list.sort)}
            {opts('period', t.list.periodLbl, t.list.period)}
            {opts('status', t.list.statusLbl, t.list.status)}
            {opts('kind', t.list.kindLbl, t.list.kind)}
          </View>

          <Text style={st.count}>{t.list.count(rows.length)}</Text>
          {rows.length === 0 ? <Text style={st.none}>{t.list.none}</Text> : rows.map((a) => {
            const c = procColor(a, procedures);
            const cancelled = a.status === 'anulat';
            const moves = rescheduleCount(a);
            return (
              <View key={a.id} style={[st.row, a.personal && { borderStyle: 'dashed', borderColor: tint(c, 0.55) }, wide && { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
                <Pressable onPress={() => setDetail(a)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="button" accessibilityLabel={`${t.list.edit}: ${apptName(a)}`}>
                  <View style={[st.bar, { backgroundColor: cancelled ? '#CFC6D2' : c }]} />
                  {a.personal ? <Ionicons name="person" size={18} color={cancelled ? colors.muted : c} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={[st.name, cancelled && st.cancelled]} numberOfLines={1}>{apptName(a)}</Text>
                    <Text style={st.sub} numberOfLines={1}>{apptSub(a)}{settings.usePrices && a.price !== undefined ? ` · ${a.personal && a.report ? '−' : ''}${a.price} ${t.lei}` : ''}</Text>
                    <Text style={st.when}>{longDate(a.date)} · {a.time}–{endTime(a.time, a.durationMin)}</Text>
                    <Row style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {a.status !== 'programat' ? <View style={[st.badge, a.status === 'finalizat' && { backgroundColor: tint(colors.success, 0.12) }]}><Text style={[st.badgeTxt, a.status === 'finalizat' && { color: colors.success }]}>{t.statuses[a.status]}</Text></View> : null}
                      {moves ? <View style={[st.badge, { backgroundColor: colors.goldSoft }]}><Text style={[st.badgeTxt, { color: '#7A5A22' }]}>{t.rs.movedTimes(moves)}</Text></View> : null}
                    </Row>
                  </View>
                </Pressable>
                <View style={wide ? { width: 560 } : { marginTop: 10 }}><ApptActions a={a} compact /></View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <DatePicker visible={pickDate} value={date} onPick={setDate} onClose={() => setPickDate(false)} />
      <AppointmentSheet target={detail ? { appt: detail } : null} onClose={() => setDetail(null)} />
    </View>
  );
}

const st = StyleSheet.create({
  dateBtn: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTxt: { fontSize: 15, ...font.w600, color: colors.ink },
  addBtn: { width: 52, minHeight: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  err: { color: colors.danger, marginTop: 6, ...font.w600, fontSize: 14 },
  hint: { color: colors.muted, marginTop: 6, fontSize: 13, ...font.reg },
  clash: { color: '#7A5600', marginTop: 6, fontSize: 13, ...font.w600 },
  fLbl: { fontSize: 11, ...font.w800, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  count: { fontSize: 12, ...font.w800, color: colors.muted, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.1 },
  none: { color: colors.muted, fontSize: 16, ...font.reg },
  row: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F2EAEC', ...shadow, shadowOpacity: 0.05 },
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  name: { fontSize: 17, ...font.w700, color: colors.ink },
  cancelled: { textDecorationLine: 'line-through', color: colors.muted },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2, ...font.w600 },
  when: { fontSize: 14, color: colors.ink, marginTop: 2, ...font.w600 },
  badge: { backgroundColor: '#EFEAF0', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, ...font.w800, color: colors.muted },
});
