import React from 'react';
import {
  Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, Platform, KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, DESKTOP_MIN, font, gradients, radius, shadow } from '../theme';

/** true pe ecrane late (browser pe calculator, tabletă orizontal) */
export function useWide() {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_MIN;
}

export function Btn({
  label, onPress, kind = 'primary', icon, style, disabled,
}: {
  label: string; onPress: () => void; kind?: 'primary' | 'soft' | 'ghost' | 'danger' | 'gold'; icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle; disabled?: boolean;
}) {
  const bg = kind === 'soft' ? colors.primarySoft : kind === 'danger' ? '#FDECEC' : 'transparent';
  const fg = kind === 'primary' || kind === 'gold' ? '#fff' : kind === 'danger' ? colors.danger : colors.primaryDark;
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btnWrap,
        (kind === 'primary' || kind === 'gold') && !disabled && s.btnGlow,
        { opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {kind === 'primary' || kind === 'gold' ? (
        <LinearGradient colors={kind === 'gold' ? gradients.gold : gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[s.btn, { backgroundColor: bg }]}>{content}</View>
      )}
    </Pressable>
  );
}

export function Chip({
  label, active, onPress, color, small, icon,
}: { label: string; active?: boolean; onPress: () => void; color?: string; small?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  const c = color || colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        small && { paddingVertical: 7, paddingHorizontal: 13 },
        active ? { backgroundColor: c, borderColor: c, ...shadow, shadowColor: c, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } : null,
        pressed && { opacity: 0.85 },
      ]}
    >
      {!active && color ? <View style={[s.chipDot, { backgroundColor: color }]} /> : null}
      {icon ? <Ionicons name={icon} size={small ? 14 : 16} color={active ? '#fff' : colors.ink} style={{ marginRight: 6 }} /> : null}
      <Text style={[s.chipText, small && { fontSize: 14 }, active ? { color: '#fff' } : null]}>{label}</Text>
    </Pressable>
  );
}

/** Comutator cu segmente (ex. Zi / Săptămână / Lună) */
export function Segmented<T extends string>({
  items, value, onChange, dark,
}: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void; dark?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
      <View style={[s.seg, dark && s.segDark]}>
        {items.map((it) => {
          const on = it.key === value;
          return (
            <Pressable key={it.key} onPress={() => onChange(it.key)} accessibilityRole="tab" accessibilityState={{ selected: on }}
              style={[s.segItem, on && (dark ? s.segOnDark : s.segOn)]}>
              <Text style={[s.segText, dark && { color: 'rgba(255,255,255,0.75)' }, on && { color: dark ? colors.plum : colors.primaryDark }]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[s.card, style as ViewStyle]}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor="#B9AEBC"
      {...props}
      onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
      style={[s.input, focus && s.inputFocus, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null, props.style]}
    />
  );
}

export function IconBtn({ name, onPress, label, size = 24, color = colors.ink, style }: {
  name: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; size?: number; color?: string; style?: ViewStyle;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} hitSlop={8} style={({ pressed }) => [s.iconBtn, style, pressed && { opacity: 0.6 }]}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

/** Antet cu degradeu prună → roz, pentru fiecare ecran */
export function Hero({ title, subtitle, children, right }: { title: string; subtitle?: string; children?: React.ReactNode; right?: React.ReactNode }) {
  const wide = useWide();
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, wide && s.heroWide]}>
      <View style={s.heroGlow} pointerEvents="none" />
      <Image source={require('../../assets/logo-light.png')} style={[s.heroLogo, wide && s.heroLogoWide]} resizeMode="contain" accessibilityLabel="A.M. Unghii" />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={s.heroSub} numberOfLines={1}>{subtitle}</Text> : null}
          <Text style={[s.heroTitle, wide && { fontSize: 36 }]} numberOfLines={1}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

/** Secțiune cu titlu, iconiță și card */
export function Section({ title, hint, icon, children }: { title: string; hint?: string; icon?: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon ? <View style={s.secIcon}><Ionicons name={icon} size={16} color={colors.primary} /></View> : null}
        <Text style={s.sec}>{title}</Text>
      </View>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <Card style={{ marginTop: 10 }}>{children}</Card>
    </View>
  );
}

/** Fereastră: urcă de jos pe telefon, dialog centrat pe calculator */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const wide = useWide();
  return (
    <Modal visible={visible} transparent animationType={wide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.overlay, wide && s.overlayWide]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Închide" />
        <View style={[s.sheet, wide && s.sheetWide]}>
          {!wide ? <View style={s.grabber} /> : null}
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>{title}</Text>
            <IconBtn name="close" onPress={onClose} label="Închide" style={s.closeBtn} size={20} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingTop: 4, paddingBottom: 36 }}>
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
  btnWrap: { borderRadius: radius.pill },
  btnGlow: { ...shadow, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  btn: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, ...font.w700, letterSpacing: 0.2 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, marginRight: 8, marginBottom: 8,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  chipText: { fontSize: 15, ...font.w600, color: colors.ink },
  seg: { flexDirection: 'row', backgroundColor: '#F1E8EB', borderRadius: radius.pill, padding: 4 },
  segDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  segItem: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radius.pill },
  segOn: { backgroundColor: '#fff', ...shadow, shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segOnDark: { backgroundColor: '#fff' },
  segText: { fontSize: 14, ...font.w700, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: '#F2EAEC', ...shadow },
  label: { fontSize: 12, ...font.w800, color: colors.muted, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.1 },
  input: {
    minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff',
    paddingHorizontal: 16, fontSize: 16, color: colors.ink, ...font.w500,
  },
  inputFocus: { borderColor: colors.primary, backgroundColor: '#FFFCFD' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  hero: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  heroWide: { marginHorizontal: 24, marginTop: 20, borderRadius: 28, paddingHorizontal: 28, paddingTop: 26, paddingBottom: 22 },
  heroLogo: { position: 'absolute', top: 4, right: 14, width: 84, height: 34 },
  heroLogoWide: { top: 10, right: 24, width: 108, height: 44 },
  heroGlow: { position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(198,161,106,0.22)' },
  heroSub: { color: '#E9C9D6', fontSize: 12, ...font.w700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  heroTitle: { color: '#fff', fontSize: 30, ...font.display },
  sec: { fontSize: 13, ...font.w800, color: colors.ink, textTransform: 'uppercase', letterSpacing: 1.1 },
  secIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  hint: { fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 20, ...font.reg },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  overlayWide: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%',
    width: '100%', maxWidth: 560, alignSelf: 'center',
  },
  sheetWide: { borderRadius: 28, maxHeight: '88%', ...shadow, shadowOpacity: 0.3, shadowRadius: 40 },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E0D3D8', marginTop: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 12, paddingTop: 12, paddingBottom: 4 },
  sheetTitle: { fontSize: 24, ...font.display, color: colors.ink, flex: 1 },
  closeBtn: { backgroundColor: '#fff', width: 36, height: 36, borderWidth: 1, borderColor: colors.line },
});
