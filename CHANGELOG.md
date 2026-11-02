# Changelog

## 1.0.0 — 2026-11-02
- Prima versiune: programări (nume, oră, procedură, durată, preț opțional, telefon, observații).
- Vederi: zi, 3 zile, săptămână, lună, an, perioadă personalizată.
- Rapoarte pe perioadă (total încasat, medie, pe proceduri) — doar dacă prețurile sunt pornite.
- Setări: servicii editabile, memento notificări, calendar telefon, ore afișate.
- Salvare automată locală + copie de siguranță; export/import Excel.
- Teste: `tsc --noEmit` OK; build web și Android (bundle) OK; test în browser (adăugare, vederi, preț → raport, persistență după reload) OK. Nu au putut fi testate pe telefon real: notificări, sincronizare calendar.
