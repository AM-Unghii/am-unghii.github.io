# Programări Unghii

Aplicație (Android, iOS, web) pentru programări manichiură/pedichiură. Interfață în română.

## Comenzi
- `npm install` — instalare
- `npm run web` / `npm start` — rulare (web / Expo Go pe telefon)
- `npx tsc --noEmit` — verificare tipuri
- `npx expo export --platform web` — build web (în `dist/`)
- `eas build -p android --profile preview` / `eas build -p ios` — build mobil (cont Expo necesar)

## Hartă
- `App.tsx` — taburi (Program / Rapoarte / Setări)
- `src/i18n.ts` — TOATE textele vizibile (română)
- `src/store/` — stare + salvare locală (AsyncStorage) cu copie de siguranță automată
- `src/services/` — notificări, calendar telefon (+ link Google Calendar), Excel (export/import), `sync.ts` (client sincronizare)
- `apps-script/Code.gs` — server de sincronizare (Google Sheet); `docs/SINCRONIZARE.md` — ghid
- `public/` — PWA (manifest, service worker, iconițe); `.github/workflows/pages.yml` — publicare web
- `src/components/`, `src/screens/` — UI; `src/components/ui.tsx` are piesele comune (Hero, Section, Sheet, Segmented, `useWide`)
- `src/theme.ts` — culori, degradeuri, fonturi (Playfair Display titluri, Manrope text; încărcate în `App.tsx`)

## Reguli
- Reguli generale: dev-framework GLOBAL_RULES.
- Texte vizibile doar prin `src/i18n.ts`.
- Date reale rămân local; în repo doar date fictive.
- Prețul e opțional și apare doar dacă `settings.usePrices` e pornit.
- Datele se salvează la fiecare modificare; nu introduce cod care șterge/rescrie datele fără confirmare.
- Ștergerea = marcaj `deleted:true` (nu se scoate rândul), altfel nu se sincronizează. UI folosește doar `appointments` din context (fără șterse).
- Cea mai recentă `updatedAt` câștigă la sincronizare; orice modificare de programare setează `updatedAt`.
- `EXPO_BASE_URL` se setează doar în CI (GitHub Pages); local rămâne gol.
- Data = `YYYY-MM-DD`, ora = `HH:mm` (fără fusuri orare, ca să nu se „mute” programările).
- Textele folosesc fonturile din `font.*` (theme), nu `fontWeight`.
- Ecran lat (≥ 960 px, `useWide()`): bară laterală + panou „Azi”; pe telefon: bară de jos plutitoare.
- Notificări: `settings.notifyVia` = `app` (notificări locale) | `device` (calendarul telefonului ales) | `google` (Apps Script → Google Calendar, setare comună în Config!D1). Doar una activă, ca să nu apară dublat.
