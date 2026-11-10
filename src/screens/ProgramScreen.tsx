import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { ViewMode, Appointment } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, gradients, shadow } from '../theme';
import { t } from '../i18n';
import {
  addDays, addMonths, addYears, cap, dayNum, longDate, monthYear, rangeDays, shortDate, startOfWeek, todayISO,
} from '../utils/date';
import { Hero, IconBtn, Segmented, useWide } from '../components/ui';
import { TimeGrid } from '../components/TimeGrid';
import { MonthView, YearView } from '../components/MonthYear';
import { ApptRow, apptSub } from '../components/ApptRow';
import { apptName } from '../utils/appts';
import { DatePicker } from '../components/DatePicker';
import { AppointmentSheet, SheetTarget } from '../components/AppointmentSheet';

const VIEWS: ViewMode[] = ['zi', '3zile', 'saptamana', 'luna', 'an', 'custom'];

function Agenda({ days, appts, onAppt, empty, hideTitle }: { days: string[]; appts: Appointment[]; onAppt: (a: Appointment) => void; empty?: string; hideTitle?: boolean }) {
  const { procedures, settings } = useApp();
  const groups = days
    .map((d) => ({ d, list: appts.filter((a) => a.date === d).sort((x, y) => x.time.localeCompare(y.time)) }))
    .filter((g) => g.list.length);
  if (!groups.length) return <Text style={st.empty}>{empty || t.empty}</Text>;
  return (
    <View>
      {groups.map((g) => (
        <View key={g.d} style={{ marginBottom: 8 }}>
          {!hideTitle ? <Text style={st.groupTitle}>{longDate(g.d)}</Text> : null}
          {g.list.map((a) => <ApptRow key={a.id} a={a} procs={procedures} showPrice={settings.usePrices} onPress={() => onAppt(a)} />)}
        </View>
      ))}
    </View>
  );
}

/** Panou lateral (doar pe calculator): azi + următoarele programări */
function SidePanel({ onAppt }: { onAppt: (a: Appointment) => void }) {
  const { appointments, procedures, settings } = useApp();
  const today = todayISO();
  const nowT = new Date();
  const nowHM = `${String(nowT.getHours()).padStart(2, '0')}:${String(nowT.getMinutes()).padStart(2, '0')}`;
  const live = appointments.filter((a) => a.status !== 'anulat');
  const todays = live.filter((a) => a.date === today).sort((x, y) => x.time.localeCompare(y.time));
  const upcoming = live
    .filter((a) => a.status === 'programat' && (a.date > today || (a.date === today && a.time >= nowHM)))
    .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
  const next = upcoming[0];
  const weekStart = startOfWeek(today);
  const weekCount = live.filter((a) => !a.personal && a.date >= weekStart && a.date <= addDays(weekStart, 6)).length;
  return (
    <ScrollView style={st.side} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={st.sideTitle}>{t.panel.today}</Text>
      <Text style={st.sideDate}>{longDate(today)}</Text>
      <View style={st.statRow}>
        <View style={st.stat}><Text style={st.statVal}>{todays.filter((a) => !a.personal).length}</Text><Text style={st.statLbl}>{t.panel.todayCount}</Text></View>
        <View style={st.stat}><Text style={st.statVal}>{weekCount}</Text><Text style={st.statLbl}>{t.panel.weekCount}</Text></View>
      </View>
      {next ? (
        <Pressable onPress={() => onAppt(next)} style={st.nextCard} accessibilityRole="button">
          <Text style={st.nextLbl}>{t.panel.next}</Text>
          <Text style={st.nextName} numberOfLines={1}>{apptName(next)}</Text>
          <Text style={st.nextSub}>{next.date === today ? t.today : shortDate(next.date)} · {next.time} · {apptSub(next)}</Text>
        </Pressable>
      ) : null}
      <Text style={[st.groupTitle, { marginTop: 22 }]}>{t.panel.todayList}</Text>
      {todays.length ? todays.map((a) => <ApptRow key={a.id} a={a} procs={procedures} showPrice={settings.usePrices} onPress={() => onAppt(a)} compact />)
        : <Text style={st.sideEmpty}>{t.noApptsDay}</Text>}
    </ScrollView>
  );
}

export function ProgramScreen({ newSignal = 0, focus }: { newSignal?: number; focus?: { date: string; n: number } }) {
  const { appointments, procedures, settings } = useApp();
  const wide = useWide();
  const [view, setView] = useState<ViewMode>(settings.defaultView);
  const [anchor, setAnchor] = useState(todayISO());
  const [selected, setSelected] = useState(todayISO());
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(addDays(todayISO(), 13));
  const [picker, setPicker] = useState<null | 'from' | 'to' | 'jump'>(null);
  const [target, setTarget] = useState<SheetTarget | null>(null);

  const step = (dir: 1 | -1) => {
    if (view === 'zi') setAnchor(addDays(anchor, dir));
    else if (view === '3zile') setAnchor(addDays(anchor, 3 * dir));
    else if (view === 'saptamana') setAnchor(addDays(anchor, 7 * dir));
    else if (view === 'luna') { const n = addMonths(anchor, dir); setAnchor(n); setSelected(n); }
    else if (view === 'an') setAnchor(addYears(anchor, dir));
  };

  const days = useMemo(() => {
    if (view === 'zi') return [anchor];
    if (view === '3zile') return rangeDays(anchor, addDays(anchor, 2));
    if (view === 'saptamana') { const s = startOfWeek(anchor); return rangeDays(s, addDays(s, 6)); }
    return [];
  }, [view, anchor]);

  const title = useMemo(() => {
    if (view === 'zi') return longDate(anchor);
    if (view === '3zile' || view === 'saptamana') {
      const a = days[0], b = days[days.length - 1];
      return a.slice(5, 7) === b.slice(5, 7) ? `${dayNum(a)} – ${dayNum(b)} ${t.months[Number(a.slice(5, 7)) - 1]}` : `${shortDate(a)} – ${shortDate(b)}`;
    }
    if (view === 'luna') return monthYear(anchor);
    if (view === 'an') return anchor.slice(0, 4);
    return `${shortDate(from)} – ${shortDate(to)}`;
  }, [view, anchor, days, from, to]);

  const openNew = (date?: string, time?: string) => setTarget({ date: date || (view === 'luna' ? selected : anchor), time });
  const openAppt = (a: Appointment) => setTarget({ appt: a });
  const goToday = () => { setAnchor(todayISO()); setSelected(todayISO()); };

  React.useEffect(() => { if (newSignal > 0) openNew(); }, [newSignal]);
  // din Acasă: apăsat pe o zi din săptămână → calendarul sare la ziua aceea
  React.useEffect(() => { if (focus) { setAnchor(focus.date); setSelected(focus.date); } }, [focus?.n]);

  const customDays = rangeDays(from, to);
  const hasAny = appointments.length > 0;
  const today = todayISO();
  const todayCount = appointments.filter((a) => a.date === today && a.status !== 'anulat' && !a.personal).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? t.greet.morning : hour < 18 ? t.greet.day : t.greet.evening;

  const main = (
    <View style={{ flex: 1 }}>
      <Hero
        subtitle={`${greet} · ${t.apptToday(todayCount)}`}
        title={cap(title)}
        right={view !== 'custom' ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconBtn name="chevron-back" onPress={() => step(-1)} label="Înapoi" color="#fff" style={st.navBtn} size={20} />
            <IconBtn name="calendar-outline" onPress={() => setPicker('jump')} label={t.chooseDate} color="#fff" style={st.navBtn} size={19} />
            <IconBtn name="chevron-forward" onPress={() => step(1)} label="Înainte" color="#fff" style={st.navBtn} size={20} />
          </View>
        ) : null}
      >
        <View style={st.heroControls}>
          <Pressable onPress={goToday} style={st.todayBtn} accessibilityRole="button"><Text style={st.todayText}>{t.today}</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Segmented dark items={VIEWS.map((v) => ({ key: v, label: t.views[v] }))} value={view} onChange={setView} />
          </View>
        </View>
      </Hero>
      {view === 'custom' ? (
        <View style={st.rangeRow}>
          <Pressable style={st.dateBtn} onPress={() => setPicker('from')}><Text style={st.dateLbl}>{t.from}</Text><Text style={st.dateVal}>{shortDate(from)} {from.slice(0, 4)}</Text></Pressable>
          <Ionicons name="arrow-forward" size={18} color={colors.muted} />
          <Pressable style={st.dateBtn} onPress={() => setPicker('to')}><Text style={st.dateLbl}>{t.to}</Text><Text style={st.dateVal}>{shortDate(to)} {to.slice(0, 4)}</Text></Pressable>
        </View>
      ) : null}

      <View style={[{ flex: 1, paddingTop: 10, paddingHorizontal: view === 'zi' || view === '3zile' || view === 'saptamana' ? 6 : 16 }, wide && { paddingHorizontal: 24 }]}>
        {days.length > 0 ? (
          <View style={[{ flex: 1 }, wide && st.wideCard]}>
            <TimeGrid days={days} appts={appointments} procs={procedures} startHour={settings.dayStartHour} endHour={settings.dayEndHour} onAppt={openAppt} onSlot={openNew} tall={wide} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 130, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {view === 'luna' ? (
              <View style={wide ? { flexDirection: 'row', gap: 24, alignItems: 'flex-start' } : undefined}>
                <View style={wide ? { flex: 3 } : undefined}>
                  <MonthView anchor={anchor} appts={appointments} procs={procedures} selected={selected} onSelect={setSelected} tall={wide} />
                </View>
                <View style={wide ? { flex: 2 } : { marginTop: 18 }}>
                  <Text style={st.groupTitle}>{longDate(selected)}</Text>
                  <Agenda days={[selected]} appts={appointments} onAppt={openAppt} empty={t.noApptsDay} hideTitle />
                </View>
              </View>
            ) : null}
            {view === 'an' ? (
              <YearView year={anchor} appts={appointments} usePrices={settings.usePrices} onMonth={(iso) => { setAnchor(iso); setSelected(iso); setView('luna'); }} cols={wide ? 4 : 2} />
            ) : null}
            {view === 'custom' ? <Agenda days={customDays} appts={appointments} onAppt={openAppt} empty={t.empty} /> : null}
          </ScrollView>
        )}
        {!hasAny && (view === 'zi' || view === '3zile' || view === 'saptamana') ? (
          <View pointerEvents="none" style={st.emptyHint}><Text style={st.emptyHintText}>{wide ? t.emptyHintWide : t.emptyHint}</Text></View>
        ) : null}
      </View>

      {!wide ? (
        <Pressable style={({ pressed }) => [st.fab, pressed && { transform: [{ scale: 0.95 }] }]} onPress={() => openNew()} accessibilityRole="button" accessibilityLabel={t.newAppt}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.fabIn}>
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {main}
      {wide ? <SidePanel onAppt={openAppt} /> : null}
      <DatePicker
        visible={picker !== null}
        value={picker === 'from' ? from : picker === 'to' ? to : anchor}
        onClose={() => setPicker(null)}
        onPick={(d) => {
          if (picker === 'from') { setFrom(d); if (d > to) setTo(d); }
          else if (picker === 'to') { setTo(d); if (d < from) setFrom(d); }
          else { setAnchor(d); setSelected(d); }
        }}
      />
      <AppointmentSheet target={target} onClose={() => setTarget(null)} />
    </View>
  );
}

const st = StyleSheet.create({
  navBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.14)' },
  heroControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  todayBtn: { backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 14, height: 38, justifyContent: 'center' },
  todayText: { color: colors.plum, fontSize: 14, ...font.w800 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  dateBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.line },
  dateLbl: { fontSize: 11, color: colors.muted, ...font.w800, textTransform: 'uppercase', letterSpacing: 1 },
  dateVal: { fontSize: 16, color: colors.ink, ...font.w700, marginTop: 2 },
  groupTitle: { fontSize: 12, ...font.w800, color: colors.muted, marginBottom: 10, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.2 },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 16, marginTop: 28, paddingHorizontal: 20, ...font.reg },
  emptyHint: { position: 'absolute', top: 110, left: 0, right: 0, alignItems: 'center' },
  emptyHintText: { color: colors.primaryDark, fontSize: 15, backgroundColor: colors.card, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, overflow: 'hidden', ...font.w600, ...shadow },
  fab: { position: 'absolute', right: 20, bottom: 96, borderRadius: 32, ...shadow, shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 16 },
  fabIn: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  wideCard: { backgroundColor: colors.card, borderRadius: 24, paddingTop: 12, paddingRight: 8, marginBottom: 20, borderWidth: 1, borderColor: '#F2EAEC', ...shadow, overflow: 'hidden' },
  side: { width: 340, flexGrow: 0, borderLeftWidth: 1, borderLeftColor: colors.line, backgroundColor: '#FCF9F8' },
  sideTitle: { fontSize: 26, ...font.display, color: colors.ink },
  sideDate: { fontSize: 14, color: colors.muted, marginTop: 2, ...font.w600 },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F2EAEC' },
  statVal: { fontSize: 28, ...font.display, color: colors.primaryDark },
  statLbl: { fontSize: 12, color: colors.muted, ...font.w700, marginTop: 2 },
  nextCard: { marginTop: 14, backgroundColor: colors.plum, borderRadius: 18, padding: 16 },
  nextLbl: { color: colors.gold, fontSize: 11, ...font.w800, letterSpacing: 1.2, textTransform: 'uppercase' },
  nextName: { color: '#fff', fontSize: 20, ...font.display, marginTop: 4 },
  nextSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, ...font.w600, marginTop: 4 },
  sideEmpty: { color: colors.muted, fontSize: 14, ...font.reg },
});
