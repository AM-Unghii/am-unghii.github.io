import { Platform, TextStyle } from 'react-native';

export const colors = {
  bg: '#F8F3F1',
  card: '#FFFFFF',
  ink: '#22162A',
  muted: '#8A7C8E',
  line: '#EDE3E6',
  primary: '#B8336A',
  primaryDark: '#8C1F4F',
  primarySoft: '#F9E6EE',
  gold: '#C6A16A',
  goldSoft: '#F6EEE2',
  plum: '#2A1631',
  plumMid: '#4A1F45',
  success: '#2E9E6B',
  danger: '#D64545',
  warn: '#C98A12',
  warnSoft: '#FFF4D9',
  overlay: 'rgba(34,22,42,0.5)',
};

/** Degradeuri (de folosit cu LinearGradient) */
export const gradients = {
  hero: ['#2A1631', '#5A2049', '#B8336A'] as const,
  primary: ['#C93D77', '#9C2457'] as const,
  gold: ['#E3C99C', '#C6A16A'] as const,
  sidebar: ['#22142A', '#3B1A3A'] as const,
};

export const procedureColors = ['#B8336A', '#7C5CD6', '#2B9AA8', '#E2873B', '#4FA36A', '#C74FB3'];

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const shadow = {
  shadowColor: '#4A1F45',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

/** Fonturi: Playfair Display pentru titluri, Manrope pentru rest. */
export const fontFiles = {
  display: 'PlayfairDisplay_700Bold',
  w400: 'Manrope_400Regular',
  w500: 'Manrope_500Medium',
  w600: 'Manrope_600SemiBold',
  w700: 'Manrope_700Bold',
  w800: 'Manrope_800ExtraBold',
};

const f = (family: string): TextStyle => ({ fontFamily: family });
export const font = {
  display: f(fontFiles.display),
  reg: f(fontFiles.w500),
  w400: f(fontFiles.w400),
  w500: f(fontFiles.w500),
  w600: f(fontFiles.w600),
  w700: f(fontFiles.w700),
  w800: f(fontFiles.w800),
};

export const isWeb = Platform.OS === 'web';

/** Lățimea de la care se folosește aspectul de calculator (bară laterală). */
export const DESKTOP_MIN = 960;

/** Culoare cu transparență (hex #RRGGBB + alfa 0..1) */
export function tint(hex: string, alpha: number) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}

/** Inițialele clientei (max. 2 litere) */
export function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}
