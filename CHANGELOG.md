# Changelog

## 1.3.3 — 2026-11-10
- Istoric prețuri mai clar: fiecare rând arată de la cât la cât s-a schimbat (ex. „100 → 120 lei”), de când e valabil și în ce zi l-ai introdus („schimbat pe …”). Prețurile introduse înainte de 1.3.3 nu au ziua schimbării.
- Teste: `tsc --noEmit` OK; build web OK; verificat în browser. Netestat pe telefon real.

## 1.3.2 — 2026-11-10
- Serviciu → câmpul „Valabil de la” apare mereu, și la primul preț al unui serviciu (înainte apărea doar după ce serviciul avea deja un preț).
- Teste: `tsc --noEmit` OK; build web OK; verificat în browser. Netestat pe telefon real.

## 1.3.1 — 2026-11-10
- Actualizare mai rapidă: pagina aplicației se cere mereu de la server (fără cache de ~10 min), deci o versiune nouă apare la prima redeschidere.
- Teste: `node --check` pe service worker OK; `tsc --noEmit` OK. Netestat pe telefon real.

## 1.3.0 — 2026-11-10
- Prețuri cu istoric: fiecare serviciu are o listă de prețuri cu „Valabil de la”. Programările își păstrează prețul lor, deci rapoartele din trecut nu se schimbă când modifici prețul.
- Programare nouă: prețul se completează cu cel valabil la data programării și se reface la schimbarea serviciului sau a datei (dacă nu l-ai scris de mână).
- La un preț nou, aplicația întreabă dacă actualizează programările „Programat” de la acea dată încolo care au încă prețul vechi. Cele finalizate, cele din trecut și cele cu preț schimbat de mână rămân neschimbate.
- Versiunea aplicației apare jos în Setări („Versiune 1.3.0 · <commit>”).
- Iconița aplicației: „A.M.” și „Unghii” pe două rânduri, scris puțin îngroșat, cam de 2 ori mai mare decât înainte; „MANICHIURĂ” scos din iconiță (nu se citea). Toate variantele (fără fundal, alb pătrat, alb rotund), iconița iPhone, favicon și iconițele Android native.
- Manifest: iconițe „maskable” pentru varianta cu fundal alb (Android le umple forma, fără ramă albă micșorată).
- Teste: `tsc --noEmit` OK; build web OK; teste pe logica prețurilor (prag de dată, înlocuire la aceeași dată, programări afectate) OK; în browser: istoric afișat, confirmare → doar programarea viitoare cu prețul vechi actualizată, prețul completat automat la programare nouă OK. Netestat pe telefon real și cu sincronizarea pe Google real.
- Teste iconițe: generare iconițe OK, verificate vizual la 512 și 96 px. Netestat pe telefon real.

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
