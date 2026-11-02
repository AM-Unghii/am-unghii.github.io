import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Appointment, Procedure } from '../types';
import { colors, radius, shadow, tint } from '../theme';
import { t } from '../i18n';
import { endTime } from '../utils/date';

export const procColor = (a: Appointment, procs: Procedure[]) =>
  procs.find((p) => p.id === a.procedureId)?.color || '#9A8FA0';

export function ApptRow({ a, procs, showPrice, onPress }: { a: Appointment; procs: Procedure[]; showPrice: boolean; onPress: () => void }) {
  const c = procColor(a, procs);
  const cancelled = a.status === 'anulat';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.row, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <View style={[st.bar, { backgroundColor: cancelled ? '#CFC6D2' : c }]} />
      <View style={st.timeCol}>
        <Text style={st.time}>{a.time}</Text>
        <Text style={st.end}>{endTime(a.time, a.durationMin)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.name, cancelled && st.cancelled]} numberOfLines={1}>{a.clientName}</Text>
        <Text style={st.proc} numberOfLines={1}>{a.procedureName}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {a.status !== 'programat' ? (
          <View style={[st.badge, { backgroundColor: a.status === 'finalizat' ? tint(colors.success, 0.15) : '#EFEAF0' }]}>
            <Text style={[st.badgeText, { color: a.status === 'finalizat' ? colors.success : colors.muted }]}>{t.statuses[a.status]}</Text>
          </View>
        ) : null}
        {showPrice && a.price !== undefined ? <Text style={st.price}>{a.price} {t.lei}</Text> : null}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 10, gap: 12, ...shadow, shadowOpacity: 0.06 },
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  timeCol: { width: 58 },
  time: { fontSize: 16, fontWeight: '800', color: colors.ink },
  end: { fontSize: 13, color: colors.muted, marginTop: 2 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  cancelled: { textDecorationLine: 'line-through', color: colors.muted },
  proc: { fontSize: 14, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
});
