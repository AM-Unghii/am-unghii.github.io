import React from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

export function Btn({
  label, onPress, kind = 'primary', icon, style, disabled,
}: {
  label: string; onPress: () => void; kind?: 'primary' | 'soft' | 'ghost' | 'danger'; icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle; disabled?: boolean;
}) {
  const bg = kind === 'primary' ? colors.primary : kind === 'soft' ? colors.primarySoft : kind === 'danger' ? '#FDECEC' : 'transparent';
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? colors.danger : colors.primaryDark;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label, active, onPress, color, small,
}: { label: string; active?: boolean; onPress: () => void; color?: string; small?: boolean }) {
  const c = color || colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[s.chip, small && { paddingVertical: 7, paddingHorizontal: 12 }, active ? { backgroundColor: c, borderColor: c } : null]}
    >
      <Text style={[s.chipText, small && { fontSize: 14 }, active ? { color: '#fff' } : null]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor="#B9AEBC" {...props} style={[s.input, props.style]} />;
}

export function IconBtn({ name, onPress, label, size = 24 }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; size?: number }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} hitSlop={8} style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]}>
      <Ionicons name={name} size={size} color={colors.ink} />
    </Pressable>
  );
}

/** Fereastră care urcă de jos */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Închide" />
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>{title}</Text>
            <IconBtn name="close" onPress={onClose} label="Închide" />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 36 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

const s = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 17, fontWeight: '700' },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.line, marginRight: 8, marginBottom: 8,
  },
  chipText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  label: { fontSize: 14, fontWeight: '700', color: colors.muted, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff',
    paddingHorizontal: 16, fontSize: 17, color: colors.ink,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%',
    width: '100%', maxWidth: 560, alignSelf: 'center',
  },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, marginTop: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, paddingTop: 6 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
});
