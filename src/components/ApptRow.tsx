import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Appointment, Procedure } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, initials, personalColor, radius, shadow, tint } from '../theme';
import { t } from '../i18n';
import { endTime } from '../utils/date';
import { apptName } from '../utils/appts';

export const procColor = (a: Appointment, procs: Procedure[]) =>
  procs.find((p) => p.id === a.procedureId)?.color || (a.personal ? personalColor : '#9A8FA0');

/** Al doilea rând: serviciul (la personale: „Personal · serviciul”). */
export const apptSub = (a: Appointment) =>
  a.personal ? (a.clientName ? `${t.personal.badge} · ${a.procedureName}` : t.personal.badge) : a.procedureName;

export function ApptRow({ a, procs, showPrice, onPress, compact }: { a: Appointment; procs: Procedure[]; showPrice: boolean; onPress: () => void; compact?: boolean }) {
  const c = procColor(a, procs);
  const cancelled = a.status === 'anulat';
  const done = a.status === 'finalizat';
  return (
    <Pressable onPress={onPress} style={({ pressed, hovered }: any) => [st.row, a.personal && { borderStyle: 'dashed', borderColor: tint(c, 0.55), backgroundColor: '#FBFAFC' }, compact && st.compact, hovered && st.hover, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <View style={[st.avatar, { backgroundColor: cancelled ? '#EFEAF0' : tint(c, 0.14) }, compact && { width: 38, height: 38, borderRadius: 19 }]}>
        {done ? <Ionicons name="checkmark" size={18} color={colors.success} />
          : a.personal ? <Ionicons name="person" size={18} color={cancelled ? colors.muted : c} />
          : <Text style={[st.avatarText, { color: cancelled ? colors.muted : c }]}>{initials(a.clientName) || '•'}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.name, compact && { fontSize: 15 }, cancelled && st.cancelled]} numberOfLines={1}>{apptName(a)}</Text>
        <View style={st.procRow}>
          <View style={[st.dot, { backgroundColor: cancelled ? '#CFC6D2' : c }]} />
          <Text style={st.proc} numberOfLines={1}>{apptSub(a)}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={st.timePill}><Text style={st.time}>{a.time}</Text></View>
        {!compact ? <Text style={st.end}>{t.until} {endTime(a.time, a.durationMin)}</Text> : null}
        {a.status !== 'programat' ? (
          <View style={[st.badge, { backgroundColor: done ? tint(colors.success, 0.12) : '#EFEAF0' }]}>
            <Text style={[st.badgeText, { color: done ? colors.success : colors.muted }]}>{t.statuses[a.status]}</Text>
          </View>
        ) : null}
        {showPrice && a.price !== undefined ? <Text style={[st.price, a.personal && { color: colors.muted }]}>{a.personal && a.report ? '−' : ''}{a.price} {t.lei}</Text> : null}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#F2EAEC', ...shadow, shadowOpacity: 0.05 },
  compact: { padding: 10, borderRadius: radius.md, shadowOpacity: 0 },
  hover: { borderColor: tint(colors.primary, 0.35) },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, ...font.w800 },
  procRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  timePill: { backgroundColor: colors.goldSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  time: { fontSize: 14, ...font.w800, color: colors.ink },
  end: { fontSize: 12, color: colors.muted, marginTop: 4, ...font.w500 },
  name: { fontSize: 17, ...font.w700, color: colors.ink },
  cancelled: { textDecorationLine: 'line-through', color: colors.muted },
  proc: { fontSize: 13, color: colors.muted, flexShrink: 1, ...font.w600 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, marginTop: 4 },
  badgeText: { fontSize: 11, ...font.w800 },
  price: { fontSize: 14, ...font.w800, color: colors.primaryDark, marginTop: 4 },
});
