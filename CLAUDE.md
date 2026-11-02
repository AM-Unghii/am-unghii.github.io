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
- `src/services/` — notificări, calendar telefon (+ link Google Calendar), Excel (export/import)
- `src/components/`, `src/screens/` — UI

## Reguli
- Reguli generale: dev-framework GLOBAL_RULES.
- Texte vizibile doar prin `src/i18n.ts`.
- Date reale rămân local; în repo doar date fictive.
- Prețul e opțional și apare doar dacă `settings.usePrices` e pornit.
- Datele se salvează la fiecare modificare; nu introduce cod care șterge/rescrie datele fără confirmare.
- Data = `YYYY-MM-DD`, ora = `HH:mm` (fără fusuri orare, ca să nu se „mute” programările).
