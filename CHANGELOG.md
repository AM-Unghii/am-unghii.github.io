# Changelog

## Nelansat
- Iconița aplicației: „A.M.” și „Unghii” pe două rânduri, scris puțin îngroșat, cam de 2 ori mai mare decât înainte; „MANICHIURĂ” scos din iconiță (nu se citea). Toate variantele (fără fundal, alb pătrat, alb rotund), iconița iPhone, favicon și iconițele Android native.
- Manifest: iconițe „maskable” pentru varianta cu fundal alb (Android le umple forma, fără ramă albă micșorată).
- Teste: generare iconițe OK, verificate vizual la 512 și 96 px. Netestat pe telefon real.

## 1.2.0 — 2026-11-02
- Aspect nou: fonturi Playfair Display + Manrope, antete cu degradeu prună–roz, accente aurii, carduri cu inițiale, bară de jos plutitoare, ferestre centrate pe calculator.
- Browser pe calculator: bară laterală (logo, „Programare nouă”, meniu, stare sincronizare), calendar mai înalt, panou „Azi” (statistici, următoarea clientă, programul zilei); luna și anul pe mai multe coloane.
- Setări → Notificări: alegi unde se creează (în aplicație / calendarul telefonului cu alegerea contului-adresei de e-mail / Google Calendar prin script, cu e-mail opțional) + buton „Trimite o notificare de test”.
- Ștergerea sau anularea unei programări scoate și evenimentul (cu alarma lui) din calendar; dacă id-ul s-a pierdut, evenimentul e căutat după marcajul `#am-<id>` / titlu. La schimbarea calendarului sau a memento-ului evenimentele viitoare se refac.
- Apps Script: coloane noi `eveniment_calendar`, `calendar_sync`; scrie/actualizează/șterge în Google Calendar.
- Teste: `tsc --noEmit` OK; build web OK; capturi în browser (telefon 390 px și calculator 1440 px) OK; Apps Script rulat în simulator Node (creare, mutare oră, ștergere, schimbare calendar + memento, test, calendar greșit) OK. Netestat pe telefon real și pe Google real: notificările locale, calendarul telefonului, Google Calendar.

## 1.1.0 — 2026-11-02
- Sincronizare între dispozitive prin Google Sheet + Apps Script (ultima modificare câștigă, ștergeri propagate, merge offline).
- PWA: manifest, service worker, iconițe; publicare automată pe GitHub Pages.
- Teste: `tsc --noEmit` OK; build web OK; test cu 2 dispozitive în browser contra unui Apps Script simulat (parolă greșită, conectare, programare nouă A→B și B→A, ștergere propagată) OK. Netestat pe Google real: scriptul Apps Script rulat doar în simulator.

## 1.0.0 — 2026-11-02
- Prima versiune: programări (nume, oră, procedură, durată, preț opțional, telefon, observații).
- Vederi: zi, 3 zile, săptămână, lună, an, perioadă personalizată.
- Rapoarte pe perioadă (total încasat, medie, pe proceduri) — doar dacă prețurile sunt pornite.
- Setări: servicii editabile, memento notificări, calendar telefon, ore afișate.
- Salvare automată locală + copie de siguranță; export/import Excel.
- Teste: `tsc --noEmit` OK; build web și Android (bundle) OK; test în browser (adăugare, vederi, preț → raport, persistență după reload) OK. Nu au putut fi testate pe telefon real: notificări, sincronizare calendar.
