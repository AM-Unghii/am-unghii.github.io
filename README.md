# Programări Unghii

Aplicație simplă și modernă pentru programări la manichiură și pedichiură — Android, iOS și web, într-un singur cod (Expo / React Native).

## Ce face
- Adaugi o programare în câteva atingeri: nume, procedură, zi, oră. Prețul e **opțional** (se pornește din Setări).
- Vederi: **Zi, 3 zile, Săptămână, Lună, An, Perioadă** liberă.
- **Rapoarte**: alegi perioada și vezi totalul încasat, media și împărțirea pe proceduri.
- **Memento** (notificare) înainte de programare; se alege în Setări.
- **Calendarul telefonului** (și Google Calendar, dacă contul e pe telefon) — opțional; plus buton „Adaugă în Google Calendar” la fiecare programare.
- **Nu se pierd datele**: salvare automată la fiecare modificare, cu copie de siguranță; **export/import Excel**.
- **Sincronizare între dispozitive** prin Google Sheet propriu (gratuit): [docs/SINCRONIZARE.md](docs/SINCRONIZARE.md).
- **PWA**: versiunea web se poate instala pe ecranul principal (Android, iPhone, calculator).
- Avertizare dacă două programări se suprapun.

## Rulare (Windows, cel mai simplu)
Dublu-click pe `PORNESTE.bat` — instalează tot ce trebuie și îți dă un meniu (browser / telefon / APK).

## Rulare manuală
```bash
npm install
npm run web        # în browser
npm start          # scanezi codul QR cu Expo Go (Android/iOS)
```

## Publicare
- **PWA automat**: la fiecare push pe `main`, GitHub Actions publică web-ul pe GitHub Pages (o singură dată: repo → Settings → Pages → Source: *GitHub Actions*). Adresa: `https://<cont>.github.io/<repo>/`, sau `https://<cont>.github.io/` dacă repo-ul se numește `<cont>.github.io`. Mai multe PWA pe același telefon: fiecare pe alt `<cont>.github.io` (vezi `docs/INSTALARE.md`).
- **Web**: `npx expo export --platform web` → încarci folderul `dist/` pe orice hosting (Netlify, Vercel, GitHub Pages, Firebase).
- **Android/iOS**: `npm i -g eas-cli`, `eas login`, apoi `eas build -p android --profile preview` (APK de test) sau `eas build -p ios`. Pentru App Store e nevoie de cont Apple Developer.

## Despre Excel
Datele stau în aplicație (pe dispozitiv). „Salvează tot în Excel” creează un fișier `.xlsx` cu toate programările (îl poți deschide și în Google Sheets); „Încarcă din Excel” îl citește înapoi. Sincronizarea live între dispozitive folosește un Google Sheet (vezi mai sus).
