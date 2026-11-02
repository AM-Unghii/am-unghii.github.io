import { Platform } from 'react-native';
import { LogoBg, LogoShape } from '../types';

export type LogoVariant = 'alb-patrat' | 'alb-rotund' | 'transparent';

export const logoVariant = (bg: LogoBg, shape: LogoShape): LogoVariant =>
  bg === 'transparent' ? 'transparent' : shape === 'rotund' ? 'alb-rotund' : 'alb-patrat';

export const logoImages: Record<LogoVariant, number> = {
  'alb-patrat': require('../../assets/icons/alb-patrat.png'),
  'alb-rotund': require('../../assets/icons/alb-rotund.png'),
  transparent: require('../../assets/icons/transparent.png'),
};

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); }
  if (el.getAttribute('href') !== href) el.setAttribute('href', href);
}

/** Pe web: alege manifestul (iconița la instalare), favicon-ul și iconița pentru iPhone. */
export function applyAppIcon(v: LogoVariant) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  setLink('manifest', v === 'alb-patrat' ? 'manifest.webmanifest' : `manifest-${v}.webmanifest`);
  setLink('icon', `icons/${v}-192.png`);
  setLink('apple-touch-icon', `icons/${v === 'transparent' ? 'alb-patrat' : v}-192.png`);
}
