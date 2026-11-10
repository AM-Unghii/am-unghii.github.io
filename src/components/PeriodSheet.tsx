import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Btn, Chip, Input, Label, Row, Sheet } from './ui';
import { DatePicker } from './DatePicker';
import { useApp } from '../store/AppContext';
import { colors, font } from '../theme';
import { t } from '../i18n';
import { addDays, dateWithYear, dowIndex, endTime, rangeDays, startOfWeek, todayISO } from '../utils/date';
import { overlapping, withPersonalFallback, isPersonalProc } from '../utils/appts';

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Rezervă mai multe zile deodată (ex. „Săptămâna verde”, școală): câte o programare personală pe zi. */
export function PeriodSheet({ visible, date, onClose, onDone }: { visible: boolean; date: string; onClose: () => void; onDone: () => void }) {
  const { appointments, procedures, settings, saveAppointment } = useApp();
  const [label, setLabel] = useState('');
  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(date);
  const [h1, setH1] = useState(8);
  const [h2, setH2] = useState(16);
  const [weekdays, setWeekdays] = useState(true);
  const [pick, setPick] = useState<null | 'from' | 'to'>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const s = startOfWeek(date);
    setLabel(''); setFrom(s); setTo(addDays(s, 4)); setH1(settings.dayStartHour); setH2(Math.min(settings.dayEndHour, 16)); setWeekdays(true);
  }, [visible]);

  const days = useMemo(
    () => (to < from ? [] : rangeDays(from, to)).filter((d) => !weekdays || (dowIndex(d) !== 0 && dowIndex(d) !== 6)),
    [from, to, weekdays],
  );
  const dur = Math.max(30, (h2 - h1) * 60);
  const clashes = days.reduce((n, d) => n + overlapping(appointments.filter((a) => !a.personal), d, hh(h1), dur).length, 0);
  const thisWeek = startOfWeek(todayISO());

  const setWeek = (s: string) => { setFrom(s); setTo(addDays(s, 4)); setWeekdays(true); };

  const save = async () => {
    setBusy(true);
    const proc = withPersonalFallback(procedures).find(isPersonalProc)!;
    for (const d of days) {
      await saveAppointment({
        clientName: label.trim() || t.period.defaultLabel, date: d, time: hh(h1), durationMin: dur,
        procedureId: proc.id, procedureName: proc.name, personal: true, report: false,
      });
    }
    setBusy(false);
    onDone();
  };

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  return (
    <>
      <Sheet visible={visible} onClose={onClose} title={t.period.title}>
        <Text style={st.hint}>{t.period.hint}</Text>
        <Label>{t.period.label}</Label>
        <Input value={label} onChangeText={setLabel} placeholder={t.period.labelPh} />
        <Label>{t.period.quick}</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip small label={t.period.thisWeek} active={from === thisWeek} onPress={() => setWeek(thisWeek)} />
          <Chip small label={t.period.nextWeek} active={from === addDays(thisWeek, 7)} onPress={() => setWeek(addDays(thisWeek, 7))} />
          <Chip small label={t.period.week2} active={from === addDays(thisWeek, 14)} onPress={() => setWeek(addDays(thisWeek, 14))} />
        </Row>
        <Row style={{ gap: 10, marginTop: 10 }}>
          <Btn kind="soft" icon="calendar" label={`${t.from} ${dateWithYear(from)}`} onPress={() => setPick('from')} style={{ flex: 1 }} />
          <Btn kind="soft" icon="calendar" label={`${t.to} ${dateWithYear(to)}`} onPress={() => setPick('to')} style={{ flex: 1 }} />
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <Text style={st.sw}>{t.period.weekdays}</Text>
          <Switch value={weekdays} onValueChange={setWeekdays} trackColor={{ true: colors.primary, false: '#DDD3DF' }} />
        </Row>
        <Label>{t.period.from}: {hh(h1)}</Label>
        <Row style={{ flexWrap: 'wrap' }}>{hours.slice(0, 16).map((h) => <Chip key={h} small label={String(h).padStart(2, '0')} active={h === h1} onPress={() => { setH1(h); if (h2 <= h) setH2(h + 1); }} />)}</Row>
        <Label>{t.period.until}: {endTime(hh(h1), dur)}</Label>
        <Row style={{ flexWrap: 'wrap' }}>{hours.filter((h) => h > h1).map((h) => <Chip key={h} small label={String(h).padStart(2, '0')} active={h === h2} onPress={() => setH2(h)} />)}</Row>
        <Text style={[st.hint, { marginTop: 12 }]}>{t.period.summary(days.length)}</Text>
        {clashes ? <View style={st.warn}><Text style={st.warnText}>{t.period.clash(clashes)}</Text></View> : null}
        <Btn label={busy ? '…' : t.period.save} icon="checkmark" disabled={busy || !days.length} onPress={save} style={{ marginTop: 20 }} />
      </Sheet>
      <DatePicker visible={pick !== null} value={pick === 'to' ? to : from} onClose={() => setPick(null)}
        onPick={(d) => { if (pick === 'from') { setFrom(d); if (d > to) setTo(d); } else { setTo(d); if (d < from) setFrom(d); } }} />
    </>
  );
}

const st = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 14, ...font.reg },
  sw: { fontSize: 16, color: colors.ink, ...font.w600 },
  warn: { backgroundColor: colors.warnSoft, padding: 12, borderRadius: 14, marginTop: 10 },
  warnText: { color: '#7A5600', ...font.w600, fontSize: 14 },
});
