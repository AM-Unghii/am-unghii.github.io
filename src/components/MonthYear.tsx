import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Appointment, Procedure } from '../types';
import { colors, radius, shadow, font } from '../theme';
import { t } from '../i18n';
import { addDays, dayNum, endOfMonth, monthYear, rangeDays, startOfMonth, startOfWeek, todayISO } from '../utils/date';
import { procColor } from './ApptRow';

export function MonthView({
  anchor, appts, procs, selected, onSelect, tall,
}: { anchor: string; appts: Appointment[]; procs: Procedure[]; selected: string; onSelect: (d: string) => void; tall?: boolean }) {
  const first = startOfWeek(startOfMonth(anchor));
  const last = endOfMonth(anchor);
  const weeks = Math.ceil((rangeDays(first, last).length) / 7);
  const days = rangeDays(first, addDays(first, weeks * 7 - 1));
  const today = todayISO();
  const by: Record<string, Appointment[]> = {};
  appts.filter((a) => a.status !== 'anulat').forEach((a) => (by[a.date] ||= []).push(a));
  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {t.daysMin.map((d, i) => <Text key={i} style={st.dow}>{d}</Text>)}
      </View>
      <View style={st.grid}>
        {days.map((d) => {
          const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
          const list = by[d] || [];
          const sel = d === selected;
          return (
            <Pressable key={d} style={st.cellWrap} onPress={() => onSelect(d)} accessibilityLabel={`${dayNum(d)}, ${t.apptCount(list.length)}`}>
              <View style={[st.cell, tall && { height: 92 }, sel && { backgroundColor: colors.primarySoft, borderColor: colors.primary }, !inMonth && { opacity: 0.4 }]}>
                <View style={[st.num, d === today && { backgroundColor: colors.primary }]}>
                  <Text style={[st.numText, d === today && { color: '#fff' }]}>{dayNum(d)}</Text>
                </View>
                <View style={st.dots}>
                  {list.slice(0, 3).map((a) => <View key={a.id} style={[st.dot, { backgroundColor: procColor(a, procs) }]} />)}
                </View>
                {list.length > 3 ? <Text style={st.more}>+{list.length - 3}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function YearView({
  year, appts, usePrices, onMonth, cols = 2,
}: { year: string; appts: Appointment[]; usePrices: boolean; onMonth: (iso: string) => void; cols?: number }) {
  const live = appts.filter((a) => a.status !== 'anulat' && a.date.startsWith(year.slice(0, 4)));
  const counts = Array.from({ length: 12 }, () => 0);
  const sums = Array.from({ length: 12 }, () => 0);
  live.forEach((a) => { const m = Number(a.date.slice(5, 7)) - 1; counts[m]++; sums[m] += a.price || 0; });
  const max = Math.max(1, ...counts);
  const thisMonth = todayISO().slice(0, 7);
  return (
    <View style={st.yGrid}>
      {counts.map((c, m) => {
        const iso = `${year.slice(0, 4)}-${String(m + 1).padStart(2, '0')}-01`;
        return (
          <Pressable key={m} style={[st.yWrap, { width: `${100 / cols}%` }]} onPress={() => onMonth(iso)} accessibilityLabel={`${monthYear(iso)}, ${t.apptCount(c)}`}>
            <View style={[st.yCard, iso.slice(0, 7) === thisMonth && { borderColor: colors.primary, borderWidth: 2 }]}>
              <Text style={st.yMonth}>{t.months[m]}</Text>
              <Text style={st.yCount}>{c}</Text>
              <Text style={st.yLbl}>{c === 1 ? 'programare' : 'programări'}</Text>
              <View style={st.yTrack}><View style={[st.yFill, { width: `${(c / max) * 100}%` }]} /></View>
              {usePrices && sums[m] > 0 ? <Text style={st.ySum}>{sums[m]} {t.lei}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  dow: { flex: 1, textAlign: 'center', color: colors.muted, ...font.w700, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100 / 7}%`, padding: 2 },
  cell: { height: 62, borderRadius: 14, borderWidth: 1.5, borderColor: '#F2EAEC', backgroundColor: colors.card, alignItems: 'center', paddingTop: 5 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 15, ...font.w700, color: colors.ink },
  dots: { flexDirection: 'row', gap: 3, marginTop: 5, height: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  more: { fontSize: 10, ...font.w700, color: colors.muted },
  yGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  yWrap: { width: '50%', padding: 6 },
  yCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1.5, borderColor: '#F2EAEC', ...shadow, shadowOpacity: 0.07 },
  yMonth: { fontSize: 15, ...font.w700, color: colors.muted, textTransform: 'capitalize' },
  yCount: { fontSize: 34, ...font.display, color: colors.ink, marginTop: 2 },
  yLbl: { fontSize: 13, color: colors.muted, ...font.reg },
  yTrack: { height: 6, backgroundColor: colors.primarySoft, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  yFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  ySum: { fontSize: 14, ...font.w800, color: colors.primaryDark, marginTop: 8 },
});
