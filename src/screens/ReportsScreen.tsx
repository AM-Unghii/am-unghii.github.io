import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, gradients, shadow } from '../theme';
import { t } from '../i18n';
import {
  addDays, addMonths, addYears, cap, endOfMonth, endOfYear, monthYear, shortDate, startOfMonth, startOfWeek, startOfYear, todayISO, longDate,
} from '../utils/date';
import { Btn, Card, Hero, IconBtn, Row, Segmented, useWide } from '../components/ui';
import { DatePicker } from '../components/DatePicker';
import { procColor } from '../components/ApptRow';

type Kind = 'azi' | 'saptamana' | 'luna' | 'an' | 'custom';
const KINDS: Kind[] = ['azi', 'saptamana', 'luna', 'an', 'custom'];

export function ReportsScreen({ goSettings }: { goSettings: () => void }) {
  const { appointments, procedures, settings } = useApp();
  const wide = useWide();
  const [kind, setKind] = useState<Kind>('luna');
  const [anchor, setAnchor] = useState(todayISO());
  const [from, setFrom] = useState(startOfMonth(todayISO()));
  const [to, setTo] = useState(todayISO());
  const [picker, setPicker] = useState<null | 'from' | 'to'>(null);

  const [a, b] = useMemo<[string, string]>(() => {
    if (kind === 'azi') return [anchor, anchor];
    if (kind === 'saptamana') { const s = startOfWeek(anchor); return [s, addDays(s, 6)]; }
    if (kind === 'luna') return [startOfMonth(anchor), endOfMonth(anchor)];
    if (kind === 'an') return [startOfYear(anchor), endOfYear(anchor)];
    return [from, to];
  }, [kind, anchor, from, to]);

  const label = kind === 'azi' ? longDate(a) : kind === 'luna' ? monthYear(a) : kind === 'an' ? a.slice(0, 4) : `${shortDate(a)} – ${shortDate(b)} ${b.slice(0, 4)}`;

  const step = (dir: 1 | -1) => {
    if (kind === 'azi') setAnchor(addDays(anchor, dir));
    else if (kind === 'saptamana') setAnchor(addDays(anchor, 7 * dir));
    else if (kind === 'luna') setAnchor(addMonths(anchor, dir));
    else if (kind === 'an') setAnchor(addYears(anchor, dir));
  };

  // programările cu cliente = încasări; cele personale (cu „Intră în rapoarte”) = cheltuieli
  const live = appointments.filter((x) => x.date >= a && x.date <= b && x.status !== 'anulat' && !x.personal);
  const inPeriod = appointments.filter((x) => x.date >= a && x.date <= b && !x.personal);
  const expenses = appointments.filter((x) => x.date >= a && x.date <= b && x.status !== 'anulat' && x.personal && x.report && x.price !== undefined);
  const spent = expenses.reduce((s, x) => s + (x.price || 0), 0);
  const cancelledN = inPeriod.filter((x) => x.status === 'anulat').length;
  const movedN = inPeriod.filter((x) => (x.reschedules?.length || 0) > 0).length;
  const movesN = inPeriod.reduce((sum, x) => sum + (x.reschedules?.length || 0), 0);
  const priced = live.filter((x) => x.price !== undefined);
  const total = priced.reduce((s, x) => s + (x.price || 0), 0);
  const byProc = useMemo(() => {
    const m = new Map<string, { name: string; color: string; n: number; sum: number }>();
    live.forEach((x) => {
      const p = procedures.find((y) => y.id === x.procedureId);
      const k = x.procedureName || 'Fără procedură';
      const cur = m.get(k) || { name: k, color: p?.color || '#9A8FA0', n: 0, sum: 0 };
      cur.n++; cur.sum += x.price || 0;
      m.set(k, cur);
    });
    return Array.from(m.values()).sort((x, y) => y.sum - x.sum || y.n - x.n);
  }, [live, procedures]);
  const byExpense = useMemo(() => {
    const m = new Map<string, { name: string; color: string; n: number; sum: number }>();
    expenses.forEach((x) => {
      const k = x.procedureName || t.personal.defaultName;
      const cur = m.get(k) || { name: k, color: procColor(x, procedures), n: 0, sum: 0 };
      cur.n++; cur.sum += x.price || 0;
      m.set(k, cur);
    });
    return Array.from(m.values()).sort((x, y) => y.sum - x.sum);
  }, [expenses, procedures]);
  const maxE = Math.max(1, ...byExpense.map((p) => p.sum));
  const maxN = Math.max(1, ...byProc.map((p) => (settings.usePrices ? p.sum || p.n : p.n)));
  const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString('ro-RO');

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <Hero title={t.reports.title} subtitle={t.reports.subtitle}>
        <View style={{ marginTop: 16 }}>
          <Segmented dark items={KINDS.map((k) => ({ key: k, label: t.reports.periods[k] }))} value={kind} onChange={(k) => { setKind(k); setAnchor(todayISO()); }} />
        </View>
      </Hero>
      <View style={[{ padding: 16 }, wide && { paddingHorizontal: 24, maxWidth: 980, width: '100%', alignSelf: 'center' }]}>

      {kind === 'custom' ? (
        <Row style={{ gap: 10, marginBottom: 12 }}>
          <Pressable style={st.dateBtn} onPress={() => setPicker('from')}><Text style={st.dLbl}>{t.from}</Text><Text style={st.dVal}>{shortDate(from)} {from.slice(0, 4)}</Text></Pressable>
          <Pressable style={st.dateBtn} onPress={() => setPicker('to')}><Text style={st.dLbl}>{t.to}</Text><Text style={st.dVal}>{shortDate(to)} {to.slice(0, 4)}</Text></Pressable>
        </Row>
      ) : (
        <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <IconBtn name="chevron-back" onPress={() => step(-1)} label="Înapoi" />
          <Text style={st.period}>{cap(label)}</Text>
          <IconBtn name="chevron-forward" onPress={() => step(1)} label="Înainte" />
        </Row>
      )}

      {settings.usePrices ? (
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <Text style={st.heroLbl}>{expenses.length ? t.reports.income : t.reports.total}</Text>
          <Text style={st.heroVal}>{fmt(total)} <Text style={st.heroUnit}>{t.lei}</Text></Text>
          <Text style={st.heroSub}>{priced.length} {t.reports.withPrice}</Text>
          {expenses.length ? (
            <View style={st.netBox}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={st.netLbl}>{t.reports.expenses} · {t.reports.expenseCount(expenses.length)}</Text>
                <Text style={st.netVal}>−{fmt(spent)} {t.lei}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={st.netLbl}>{t.reports.net}</Text>
                <Text style={[st.netVal, { fontSize: 20 }]}>{fmt(total - spent)} {t.lei}</Text>
              </Row>
            </View>
          ) : null}
        </LinearGradient>
      ) : (
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <Text style={st.offTitle}>{t.reports.pricesOffTitle}</Text>
          <Text style={st.offBody}>{t.reports.pricesOffBody}</Text>
          <Btn kind="primary" label={t.reports.goSettings} onPress={goSettings} style={{ marginTop: 12 }} />
        </Card>
      )}

      <Row style={{ gap: 12, marginTop: 12 }}>
        <Card style={{ flex: 1 }}><Text style={st.kLbl}>{t.reports.count}</Text><Text style={st.kVal}>{live.length}</Text></Card>
        {settings.usePrices ? (
          <Card style={{ flex: 1 }}><Text style={st.kLbl}>{t.reports.average}</Text><Text style={st.kVal}>{priced.length ? fmt(total / priced.length) : '–'}</Text></Card>
        ) : null}
      </Row>

      <Row style={{ gap: 12, marginTop: 12 }}>
        <Card style={{ flex: 1 }}><Text style={st.kLbl}>{t.reports.cancelled}</Text><Text style={st.kVal}>{cancelledN}</Text></Card>
        <Card style={{ flex: 1 }}>
          <Text style={st.kLbl}>{t.reports.rescheduled}</Text><Text style={st.kVal}>{movedN}</Text>
          {movesN !== movedN ? <Text style={st.note}>{t.reports.moves(movesN)}</Text> : null}
        </Card>
      </Row>

      <Text style={st.sec}>{t.reports.byProcedure}</Text>
      {byProc.length === 0 ? <Text style={st.none}>{t.reports.noData}</Text> : (
        <Card>
          {byProc.map((p, i) => (
            <View key={p.name} style={[{ paddingVertical: 10 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={st.pName}>{p.name}</Text>
                <Text style={st.pVal}>{settings.usePrices && p.sum > 0 ? `${fmt(p.sum)} ${t.lei} · ` : ''}{p.n}×</Text>
              </Row>
              <View style={st.track}><View style={[st.fill, { backgroundColor: p.color, width: `${((settings.usePrices ? p.sum || p.n : p.n) / maxN) * 100}%` }]} /></View>
            </View>
          ))}
        </Card>
      )}
      {settings.usePrices && byExpense.length ? (
        <>
          <Text style={st.sec}>{t.reports.byExpense}</Text>
          <Card>
            {byExpense.map((p, i) => (
              <View key={p.name} style={[{ paddingVertical: 10 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={st.pName}>{p.name}</Text>
                  <Text style={[st.pVal, { color: colors.muted }]}>−{fmt(p.sum)} {t.lei} · {p.n}×</Text>
                </Row>
                <View style={st.track}><View style={[st.fill, { backgroundColor: p.color, width: `${(p.sum / maxE) * 100}%` }]} /></View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
      {settings.usePrices ? <Text style={st.note}>{t.reports.note}</Text> : null}
      {settings.usePrices ? <Text style={st.note}>{t.reports.personalNote}</Text> : null}
      <Text style={st.note}>{t.reports.noteStatus}</Text>

      <DatePicker
        visible={picker !== null}
        value={picker === 'from' ? from : to}
        onClose={() => setPicker(null)}
        onPick={(d) => {
          if (picker === 'from') { setFrom(d); if (d > to) setTo(d); } else { setTo(d); if (d < from) setFrom(d); }
        }}
      />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  h1: { fontSize: 30, ...font.w800, color: colors.ink, marginBottom: 12 },
  period: { fontSize: 19, ...font.w800, color: colors.ink },
  dateBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 10, borderWidth: 1.5, borderColor: colors.line },
  dLbl: { fontSize: 12, color: colors.muted, ...font.w700, textTransform: 'uppercase' },
  dVal: { fontSize: 16, color: colors.ink, ...font.w700, marginTop: 2 },
  hero: { borderRadius: 24, padding: 22, ...shadow, shadowOpacity: 0.2 },
  heroLbl: { color: colors.gold, fontSize: 15, ...font.w700, textTransform: 'uppercase', letterSpacing: 0.6 },
  heroVal: { color: '#fff', fontSize: 46, ...font.display, marginTop: 4 },
  heroUnit: { fontSize: 22, ...font.w700 },
  heroSub: { color: '#FFD9E6', marginTop: 4, fontSize: 15, ...font.reg },
  offTitle: { fontSize: 18, ...font.w800, color: colors.primaryDark },
  offBody: { fontSize: 15, color: colors.ink, marginTop: 4, ...font.reg },
  kLbl: { fontSize: 13, color: colors.muted, ...font.w700, textTransform: 'uppercase' },
  kVal: { fontSize: 32, ...font.display, color: colors.ink, marginTop: 4 },
  sec: { fontSize: 15, ...font.w800, color: colors.muted, textTransform: 'uppercase', marginTop: 22, marginBottom: 8, letterSpacing: 0.6 },
  none: { color: colors.muted, fontSize: 16, ...font.reg },
  pName: { fontSize: 16, ...font.w700, color: colors.ink, flex: 1 },
  pVal: { fontSize: 15, ...font.w700, color: colors.primaryDark },
  track: { height: 8, borderRadius: 4, backgroundColor: '#F3ECEF', marginTop: 8, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  netBox: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  netLbl: { color: '#FFD9E6', fontSize: 14, ...font.w600, flex: 1 },
  netVal: { color: '#fff', fontSize: 17, ...font.w800 },
  note: { color: colors.muted, fontSize: 13, marginTop: 14, lineHeight: 19, ...font.reg },
});
