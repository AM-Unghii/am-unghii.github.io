import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { ViewMode, Appointment } from '../types';
import { colors, shadow } from '../theme';
import { t } from '../i18n';
import {
  addDays, addMonths, addYears, cap, dayNum, longDate, monthYear, rangeDays, shortDate, startOfWeek, todayISO, dowIndex,
} from '../utils/date';
import { Chip, IconBtn } from '../components/ui';
import { TimeGrid } from '../components/TimeGrid';
import { MonthView, YearView } from '../components/MonthYear';
import { ApptRow } from '../components/ApptRow';
import { DatePicker } from '../components/DatePicker';
import { AppointmentSheet, SheetTarget } from '../components/AppointmentSheet';

const VIEWS: ViewMode[] = ['zi', '3zile', 'saptamana', 'luna', 'an', 'custom'];

function Agenda({ days, appts, onAppt, empty }: { days: string[]; appts: Appointment[]; onAppt: (a: Appointment) => void; empty?: string }) {
  const { procedures, settings } = useApp();
  const groups = days
    .map((d) => ({ d, list: appts.filter((a) => a.date === d).sort((x, y) => x.time.localeCompare(y.time)) }))
    .filter((g) => g.list.length);
  if (!groups.length) return <Text style={st.empty}>{empty || t.empty}</Text>;
  return (
    <View>
      {groups.map((g) => (
        <View key={g.d} style={{ marginBottom: 8 }}>
          <Text style={st.groupTitle}>{longDate(g.d)}</Text>
          {g.list.map((a) => <ApptRow key={a.id} a={a} procs={procedures} showPrice={settings.usePrices} onPress={() => onAppt(a)} />)}
        </View>
      ))}
    </View>
  );
}

export function ProgramScreen() {
  const { appointments, procedures, settings } = useApp();
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

  const customDays = rangeDays(from, to);
  const hasAny = appointments.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={st.header}>
        <View style={st.titleRow}>
          {view !== 'custom' ? <IconBtn name="chevron-back" onPress={() => step(-1)} label="Înapoi" /> : <View style={{ width: 44 }} />}
          <Pressable style={{ flex: 1, alignItems: 'center' }} onPress={() => view !== 'custom' && setPicker('jump')} accessibilityLabel="Alege data">
            <Text style={st.title} numberOfLines={1}>{cap(title)}</Text>
          </Pressable>
          {view !== 'custom' ? <IconBtn name="chevron-forward" onPress={() => step(1)} label="Înainte" /> : <View style={{ width: 44 }} />}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          <Chip small label={t.today} onPress={goToday} active={false} />
          {VIEWS.map((v) => <Chip key={v} small label={t.views[v]} active={view === v} onPress={() => setView(v)} />)}
        </ScrollView>
        {view === 'custom' ? (
          <View style={st.rangeRow}>
            <Pressable style={st.dateBtn} onPress={() => setPicker('from')}><Text style={st.dateLbl}>{t.from}</Text><Text style={st.dateVal}>{shortDate(from)} {from.slice(0, 4)}</Text></Pressable>
            <Ionicons name="arrow-forward" size={18} color={colors.muted} />
            <Pressable style={st.dateBtn} onPress={() => setPicker('to')}><Text style={st.dateLbl}>{t.to}</Text><Text style={st.dateVal}>{shortDate(to)} {to.slice(0, 4)}</Text></Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, paddingHorizontal: view === 'zi' || view === '3zile' || view === 'saptamana' ? 6 : 16 }}>
        {days.length > 0 ? (
          <TimeGrid days={days} appts={appointments} procs={procedures} startHour={settings.dayStartHour} endHour={settings.dayEndHour} onAppt={openAppt} onSlot={openNew} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 130, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {view === 'luna' ? (
              <>
                <MonthView anchor={anchor} appts={appointments} procs={procedures} selected={selected} onSelect={setSelected} />
                <View style={{ height: 18 }} />
                <Agenda days={[selected]} appts={appointments} onAppt={openAppt} empty={t.noApptsDay} />
              </>
            ) : null}
            {view === 'an' ? (
              <YearView year={anchor} appts={appointments} usePrices={settings.usePrices} onMonth={(iso) => { setAnchor(iso); setSelected(iso); setView('luna'); }} />
            ) : null}
            {view === 'custom' ? <Agenda days={customDays} appts={appointments} onAppt={openAppt} empty={t.empty} /> : null}
          </ScrollView>
        )}
        {!hasAny && (view === 'zi' || view === '3zile' || view === 'saptamana') ? (
          <View pointerEvents="none" style={st.emptyHint}><Text style={st.emptyHintText}>{t.emptyHint}</Text></View>
        ) : null}
      </View>

      <Pressable style={({ pressed }) => [st.fab, pressed && { transform: [{ scale: 0.95 }] }]} onPress={() => openNew()} accessibilityRole="button" accessibilityLabel={t.newAppt}>
        <Ionicons name="add" size={34} color="#fff" />
      </Pressable>

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
  header: { paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  dateBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 10, borderWidth: 1.5, borderColor: colors.line },
  dateLbl: { fontSize: 12, color: colors.muted, fontWeight: '700', textTransform: 'uppercase' },
  dateVal: { fontSize: 16, color: colors.ink, fontWeight: '700', marginTop: 2 },
  groupTitle: { fontSize: 15, fontWeight: '800', color: colors.muted, marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 16, marginTop: 28, paddingHorizontal: 20 },
  emptyHint: { position: 'absolute', top: 90, left: 0, right: 0, alignItems: 'center' },
  emptyHintText: { color: colors.muted, fontSize: 15, backgroundColor: colors.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, overflow: 'hidden' },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadow, shadowColor: colors.primaryDark, shadowOpacity: 0.35,
  },
});
