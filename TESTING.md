# Teste

Înainte de test, verifică versiunea: **Setări → jos, „Versiune …”**. Trebuie să fie cea de mai jos.

## 1.4.0 — tab „Programări”, reprogramare, anulare, ștergere
Înainte: Setări, jos: „Versiune 1.4.0”. Dacă folosești Google Calendar/sincronizare: lipește noul Code.gs în Apps Script și publică o versiune nouă.
1. Tab „Programări”: rândul de sus — scrii nume, alegi data, scrii ora (ex. 1430 sau 14:30), Enter → apare în listă. Fără nume sau oră: mesaj de eroare.
2. Schimbă Sortarea / Perioada / Statusul → lista se reordonează și se filtrează; închide și redeschide aplicația → alegerile rămân.
3. „Reprogramează” pe o programare → calendar → alegi ziua → scrii ora → „Mută”. Rândul apare cu „mutată o dată”. Status „Reprogramate” o arată.
4. „Anulează” → confirmare → rămâne în listă tăiată, „Anulată”. „Reactivează” o readuce.
5. „Șterge” → confirmare → dispare definitiv.
6. Program (calendar) → apeși pe o programare → jos: aceleași 3 butoane.
7. Rapoarte → „Anulate” și „Reprogramate” corespund cu cele de mai sus.
8. Cu sincronizarea: pe al doilea dispozitiv apar mutarea, anularea și ștergerea; Google Calendar: evenimentul se mută / dispare.

## 1.3.3 — istoric „de la cât la cât”
1. Setări → serviciu cu preț 100 → Preț nou 120, Valabil de la o dată viitoare → Salvează → redeschizi: rândul de sus arată „100 → 120 lei”, „de la <data> · urmează” și „schimbat pe <azi>”.

## 1.3.2 — „Valabil de la” la primul preț
1. Setări → un serviciu fără preț → apar „Preț obișnuit” și „Valabil de la” (azi).
2. Scrii 100, alegi o dată → Salvează → redeschizi serviciul: „Istoric prețuri: 100 lei · de la <data>”.

## 1.3.1 — actualizare rapidă
1. După publicare (vezi Actions, verde), închizi aplicația/tab-ul și redeschizi → Setări, jos: „Versiune 1.3.1”. Dacă încă arată versiunea veche, o mai redeschizi o dată (prima deschidere instalează noul service worker).

## 1.3.0 — prețuri cu istoric

Pregătire: Setări → „Folosesc prețuri” pornit; serviciul Manichiură cu un preț (ex. 100 lei); câteva programări Manichiură: una trecută și „Finalizat”, două viitoare „Programat” cu 100 lei, una viitoare cu alt preț scris de mână (ex. 90).

1. Setări → jos → apare „Versiune 1.3.0 · <cod>”.
2. Setări → Manichiură → se vede „Istoric prețuri: 100 lei · dintotdeauna”.
3. Scrii „Preț nou” 120, „Valabil de la” = o dată de peste o săptămână → Salvează → întrebarea „Actualizez programările viitoare?” cu numărul programărilor de la acea dată care au 100 lei.
4. Alegi „Da” → programările de după dată au 120; cea cu 90, cele dinainte de dată și cea finalizată rămân neschimbate.
5. Rapoarte → perioada trecută are aceleași sume ca înainte.
6. Programare nouă → Manichiură azi → prețul propus e 100; schimbi data după data prețului nou → prețul devine 120.
7. Scrii de mână alt preț și schimbi serviciul sau data → prețul scris rămâne.
8. Lista de servicii arată „100 lei · apoi 120 lei de la …”; după acea dată arată doar 120.
9. Cu sincronizarea pornită: pe al doilea dispozitiv apare același istoric de prețuri și prețurile actualizate.

## 1.3.0 — iconița mai mare
1. Telefon: ține apăsat pe iconița „Programări” → Dezinstalează (datele sunt pe server dacă sincronizarea e pornită; altfel exportă întâi Excel din Setări).
2. Deschide https://amunghii.github.io/ în Chrome → Instalează aplicația → pe ecran apare „A.M.” / „Unghii” pe două rânduri, mare și ușor de citit.
3. Setări → Logo-ul aplicației: schimbă Fundal / Formă → preview-ul arată logo-ul pe două rânduri.
4. Cu fundal alb: reinstalează → iconița umple forma telefonului (fără cerc alb mic în interior).
