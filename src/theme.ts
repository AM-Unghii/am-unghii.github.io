export const colors = {
  bg: '#FBF7F8',
  card: '#FFFFFF',
  ink: '#2B2130',
  muted: '#8B7F90',
  line: '#EFE6EA',
  primary: '#D6457A',
  primaryDark: '#B02D5F',
  primarySoft: '#FCE7EF',
  success: '#2E9E6B',
  danger: '#D64545',
  warn: '#C98A12',
  warnSoft: '#FFF4D9',
  overlay: 'rgba(43,33,48,0.45)',
};

export const procedureColors = ['#D6457A', '#7C5CD6', '#2B9AA8', '#E2873B', '#4FA36A', '#C74FB3'];

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const shadow = {
  shadowColor: '#7A2A4D',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

/** Culoare cu transparență (hex #RRGGBB + alfa 0..1) */
export function tint(hex: string, alpha: number) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}
