# Programări Unghii

Aplicație simplă și modernă pentru programări la manichiură și pedichiură — Android, iOS și web, într-un singur cod (Expo / React Native).

## Ce face
- Adaugi o programare în câteva atingeri: nume, procedură, zi, oră. Prețul e **opțional** (se pornește din Setări).
- Vederi: **Zi, 3 zile, Săptămână, Lună, An, Perioadă** liberă.
- **Rapoarte**: alegi perioada și vezi totalul încasat, media și împărțirea pe proceduri.
- **Memento** (notificare) înainte de programare; se alege în Setări.
- **Calendarul telefonului** (și Google Calendar, dacă contul e pe telefon) — opțional; plus buton „Adaugă în Google Calendar” la fiecare programare.
- **Nu se pierd datele**: salvare automată la fiecare modificare, cu copie de siguranță; **export/import Excel**.
- Avertizare dacă două programări se suprapun.

## Rulare
```bash
npm install
npm run web        # în browser
npm start          # scanezi codul QR cu Expo Go (Android/iOS)
```

## Publicare
- **Web**: `npx expo export --platform web` → încarci folderul `dist/` pe orice hosting (Netlify, Vercel, GitHub Pages, Firebase).
- **Android/iOS**: `npm i -g eas-cli`, `eas login`, apoi `eas build -p android --profile preview` (APK de test) sau `eas build -p ios`. Pentru App Store e nevoie de cont Apple Developer.

## Despre Excel
Datele stau în aplicație (pe dispozitiv). „Salvează tot în Excel” creează un fișier `.xlsx` cu toate programările (îl poți deschide și în Google Sheets); „Încarcă din Excel” îl citește înapoi. O legătură *live* cu un Excel/Google Sheets din cloud necesită un server și cont — poate fi adăugată ulterior.
