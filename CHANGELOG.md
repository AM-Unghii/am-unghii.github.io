# Changelog

## 1.5.2 — 2026-11-10
- **„Toată ziua”** pentru perioade (săptămâna verde, concediu, școală): în „Rezervă mai multe zile” e pornit implicit și nu mai trebuie oră. În calendar apare ca bandă sus pe fiecare zi, iar la verificarea unei programări contează ca ocupat toată ziua. Poți dezactiva comutatorul ca să alegi ore. Și la o programare personală simplă există butonul „Toată ziua”. Fără schimbări în Code.gs.

## 1.5.1 — 2026-11-10
- **Rezervă o perioadă**: la „Programare personală” apare butonul „Rezervă mai multe zile (săptămâna verde, școală…)”. Alegi săptămâna (săptămâna asta / viitoare / peste 2) sau datele de la–până, numele („Săptămâna verde”), orele și dacă doar luni–vineri. Se pune câte o programare personală pe zi (fără cheltuială), vizibilă în calendar și luată în calcul la suprapuneri. Se modifică sau se șterge pe fiecare zi în parte. Fără schimbări în Code.gs față de 1.5.0.

## 1.5.0 — 2026-11-10
- **Culori la servicii**: 20 de culori de ales (în loc de 6). Culoarea apare în calendar, în listă, în ziua din „Lună” și în rapoarte.
- **Programări personale** (ale tale, de ex. la alt salon, coafor, medic): în fereastra programării alegi sus „Pentru o clientă” sau „Personală (a mea)”. La personale numele e opțional („Unde / cu cine”), fără telefon, cu preț opțional („Cât plătesc”) și comutatorul „Intră în rapoarte ca cheltuială”.
- Apar în **același calendar**, cu chenar punctat și iconiță de persoană, în culoarea lor (implicit gri-albăstrui). Și în tabul „Programări” (filtru nou „Tip”: toate / cliente / personale), unde le poți adăuga și din rândul rapid (fără nume).
- **Suprapuneri**: programările personale contează la verificare („Atenție: atunci ai o programare personală…”). În fereastra programării apare acum lista „În ziua aceea” cu tot ce mai ai în ziua aleasă (cliente + personale), cu suprapunerile evidențiate.
- **Servicii de tip „Personal”**: la fiecare serviciu alegi tipul „Pentru cliente” (încasare) sau „Personal” (cheltuială), plus dacă prețul intră implicit în rapoarte. Dacă nu ai niciun serviciu personal, apare automat „Programare personală”. Instalările noi îl au în listă.
- **Rapoarte**: Încasări, Cheltuieli și ce rămâne (net), plus secțiunea „Cheltuieli (programări personale)”. Programările personale nu se numără la programări, medie, anulate, reprogramate, nici în „programări azi”.
- Sincronizare: coloane noi `personal` și `in_rapoarte` în Google Sheet — **trebuie lipit din nou Code.gs și publicată o versiune nouă**. Fără asta, pe celelalte dispozitive o programare personală se recunoaște tot după tipul serviciului, dar comutatorul „Intră în rapoarte” de pe programare nu ajunge. Google Calendar: titlul unei programări personale e „Serviciu · loc”. Excel: coloane „Personal” și „În rapoarte”.

## 1.4.0 — 2026-11-10
- Tab nou „Programări” (între Program și Rapoarte): lista tuturor programărilor, ca într-un tabel. Sortare (dată, nume, procedură, adăugate recent), perioadă (de azi încolo, azi, săptămâna asta, trecute, toate), status (inclusiv „Reprogramate”) și căutare. Alegerile se păstrează.
- Rândul de sus = adăugare rapidă: nume, dată (calendar), oră, procedură; Enter adaugă programarea, care intră în listă în ordinea aleasă. Avertizează dacă se suprapune.
- Pe fiecare programare, trei butoane: **Reprogramează** (se deschide calendarul, apoi ora), **Anulează** (rămâne în listă cu statusul „Anulată”, cu confirmare) și **Șterge** (definitiv, cu confirmare). Aceleași butoane apar și în fereastra programării din calendar. O programare anulată se poate reactiva sau reprograma.
- Fiecare mutare se ține minte (de unde → unde). Rapoarte: carduri noi „Anulate” și „Reprogramate”.
- Sincronizare: coloană nouă `reprogramari` în Google Sheet — **trebuie lipit din nou Code.gs și publicată o versiune nouă** (fără asta, lista de mutări nu ajunge pe celelalte dispozitive; restul merge ca înainte). Google Calendar: mutarea mută evenimentul, anularea/ștergerea îl scoate, reactivarea îl recreează (logica existentă). Excel: coloană „Reprogramări”.
- Teste: vezi PR.

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
