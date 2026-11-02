import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet, IconBtn, Btn } from './ui';
import { colors } from '../theme';
import { t } from '../i18n';
import { addDays, addMonths, dayNum, endOfMonth, monthYear, startOfMonth, startOfWeek, todayISO, rangeDays } from '../utils/date';

export function DatePicker({
  visible, value, onPick, onClose, title,
}: { visible: boolean; value: string; onPick: (iso: string) => void; onClose: () => void; title?: string }) {
  const [month, setMonth] = useState(startOfMonth(value));
  React.useEffect(() => { if (visible) setMonth(startOfMonth(value)); }, [visible, value]);
  const first = startOfWeek(month);
  const days = rangeDays(first, addDays(first, 41));
  const today = todayISO();
  return (
    <Sheet visible={visible} onClose={onClose} title={title || t.chooseDate}>
      <View style={st.head}>
        <IconBtn name="chevron-back" onPress={() => setMonth(addMonths(month, -1))} label="Luna precedentă" />
        <Text style={st.month}>{monthYear(month)}</Text>
        <IconBtn name="chevron-forward" onPress={() => setMonth(addMonths(month, 1))} label="Luna următoare" />
      </View>
      <View style={st.row}>
        {t.daysMin.map((d, i) => <Text key={i} style={st.dow}>{d}</Text>)}
      </View>
      <View style={st.grid}>
        {days.map((d) => {
          const inMonth = d >= month && d <= endOfMonth(month);
          const sel = d === value;
          return (
            <Pressable key={d} onPress={() => { onPick(d); onClose(); }} style={st.cellWrap} accessibilityLabel={d}>
              <View style={[st.cell, sel && { backgroundColor: colors.primary }, !sel && d === today && { borderWidth: 2, borderColor: colors.primary }]}>
                <Text style={[st.num, !inMonth && { color: '#CFC6D2' }, sel && { color: '#fff', fontWeight: '800' }]}>{dayNum(d)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Btn kind="soft" label={t.today} onPress={() => { onPick(today); onClose(); }} style={{ marginTop: 16 }} />
    </Sheet>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 19, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', marginTop: 8 },
  dow: { flex: 1, textAlign: 'center', color: colors.muted, fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cellWrap: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  cell: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 17, color: colors.ink, fontWeight: '600' },
});
