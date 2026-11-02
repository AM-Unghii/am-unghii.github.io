import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Appointment, Procedure } from '../types';
import { colors, tint, font } from '../theme';
import { t } from '../i18n';
import { dayNum, dowIndex, toMin, todayISO } from '../utils/date';
import { procColor } from './ApptRow';

const HOUR_H_BASE = 64;
const GUTTER = 42;

interface Placed { a: Appointment; lane: number; lanes: number }

function place(list: Appointment[]): Placed[] {
  const sorted = [...list].sort((x, y) => toMin(x.time) - toMin(y.time) || y.durationMin - x.durationMin);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    cluster.forEach((p) => (p.lanes = laneEnds.length));
    out.push(...cluster);
    cluster = []; laneEnds = []; clusterEnd = -1;
  };
  for (const a of sorted) {
    const s = toMin(a.time);
    const e = s + a.durationMin;
    if (cluster.length && s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e); } else laneEnds[lane] = e;
    clusterEnd = Math.max(clusterEnd, e);
    cluster.push({ a, lane, lanes: 1 });
  }
  flush();
  return out;
}

export function TimeGrid({
  days, appts, procs, startHour, endHour, onAppt, onSlot, tall,
}: {
  days: string[]; appts: Appointment[]; procs: Procedure[]; startHour: number; endHour: number;
  onAppt: (a: Appointment) => void; onSlot: (date: string, time: string) => void; tall?: boolean;
}) {
  const HOUR_H = tall ? 76 : HOUR_H_BASE;
  const today = todayISO();
  const visible = useMemo(() => appts.filter((a) => a.status !== 'anulat'), [appts]);

  let lo = startHour; let hi = endHour;
  for (const a of visible) {
    if (!days.includes(a.date)) continue;
    lo = Math.min(lo, Math.floor(toMin(a.time) / 60));
    hi = Math.max(hi, Math.ceil((toMin(a.time) + a.durationMin) / 60));
  }
  const hours = Array.from({ length: Math.max(1, hi - lo) }, (_, i) => lo + i);
  const narrow = days.length > 3 && !tall;
  const now = new Date();
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60 - lo) * HOUR_H;

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headRow}>
        <View style={{ width: GUTTER }} />
        {days.map((d) => {
          const isToday = d === today;
          return (
            <View key={d} style={st.headCell}>
              <Text style={[st.dow, isToday && { color: colors.primary }]}>{t.daysShort[dowIndex(d)]}</Text>
              <View style={[st.dnumWrap, isToday && { backgroundColor: colors.primary }]}>
                <Text style={[st.dnum, isToday && { color: '#fff' }]}>{dayNum(d)}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', height: hours.length * HOUR_H }}>
          <View style={{ width: GUTTER }}>
            {hours.map((h) => (
              <Text key={h} style={[st.hourLabel, { top: (h - lo) * HOUR_H - 7 }]}>{String(h).padStart(2, '0')}:00</Text>
            ))}
          </View>
          {days.map((d) => {
            const placed = place(visible.filter((a) => a.date === d));
            return (
              <View key={d} style={[st.col, d === today && { backgroundColor: tint(colors.primary, 0.04) }]}>
                {hours.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => onSlot(d, `${String(h).padStart(2, '0')}:00`)}
                    style={({ hovered }: any) => [st.slot, { height: HOUR_H }, hovered && { backgroundColor: tint(colors.primary, 0.05) }]}
                    accessibilityLabel={`Adaugă la ${h}:00`}
                  />
                ))}
                {placed.map(({ a, lane, lanes }) => {
                  const top = (toMin(a.time) / 60 - lo) * HOUR_H;
                  const h = Math.max(22, (a.durationMin / 60) * HOUR_H - 2);
                  const c = procColor(a, procs);
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => onAppt(a)}
                      accessibilityLabel={`${a.time} ${a.clientName}`}
                      style={[
                        st.block,
                        {
                          top, height: h, left: `${(lane / lanes) * 100}%`, width: `${100 / lanes}%`,
                          backgroundColor: a.status === 'finalizat' ? tint(c, 0.26) : tint(c, 0.14), borderLeftColor: c,
                        },
                      ]}
                    >
                      {narrow && lanes > 1 ? (
                        <Text style={[st.bName, { fontSize: 12, textAlign: 'center' }]}>{a.clientName.charAt(0).toUpperCase()}</Text>
                      ) : (
                        <Text style={[st.bName, narrow && { fontSize: 11 }]} numberOfLines={narrow ? 2 : 1}>{a.clientName}</Text>
                      )}
                      {h >= 40 && !narrow ? <Text style={st.bSub} numberOfLines={1}>{a.time} · {a.procedureName}</Text> : null}
                      {h >= 40 && narrow && lanes === 1 ? <Text style={st.bSubN} numberOfLines={1}>{a.time}</Text> : null}
                    </Pressable>
                  );
                })}
                {d === today && nowTop > 0 && nowTop < hours.length * HOUR_H ? (
                  <View pointerEvents="none" style={[st.nowLine, { top: nowTop }]}><View style={st.nowDot} /></View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  headRow: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  headCell: { flex: 1, alignItems: 'center' },
  dow: { fontSize: 12, ...font.w700, color: colors.muted, textTransform: 'uppercase' },
  dnumWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  dnum: { fontSize: 17, ...font.w800, color: colors.ink },
  hourLabel: { position: 'absolute', right: 6, fontSize: 11, color: colors.muted, ...font.w600 },
  col: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.line },
  slot: { borderTopWidth: 1, borderTopColor: '#F3ECEE' },
  block: { position: 'absolute', borderRadius: 10, borderLeftWidth: 3, paddingHorizontal: 5, paddingVertical: 3, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.04)' },
  bName: { fontSize: 14, ...font.w800, color: colors.ink },
  bSub: { fontSize: 12, color: '#5E5264', marginTop: 1, ...font.reg },
  bSubN: { fontSize: 10, color: '#5E5264', ...font.reg },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.danger },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
});
