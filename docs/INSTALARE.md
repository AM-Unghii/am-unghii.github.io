# Instalare pe telefon (Android, Chrome)

Adresa: https://bogdanpaulmurar-hash.github.io/AM_Unghii/

## Instalare
1. Deschide adresa în **Chrome**.
2. Meniu (⋮) → **Instalează aplicația** / **Adaugă pe ecranul de pornire** → **Instalează**.

## Dacă Chrome spune „Această aplicație este instalată deja” și nu se deschide
Telefonul ține minte o instalare veche, stricată. O scoți și instalezi din nou:

0. Siguranță: în aplicație, Setări → **Sincronizează acum** (sau **Salvează tot în Excel**).
1. Ține apăsat pe iconița veche „Programări” → **Dezinstalează**.
   Dacă nu o găsești: Setări telefon → Aplicații → caută „Programări” → Dezinstalează.
2. Închide Chrome complet (din lista de aplicații recente), apoi deschide-l din nou.
3. Intră pe adresă, așteaptă să se încarce, apoi meniu (⋮) → **Instalează aplicația**.

Alte aplicații PWA de pe telefon (de pe alte site-uri) nu se încurcă cu aceasta; poți avea câte vrei.

## Logo-ul (Setări → Logo-ul aplicației)
- **Fundal**: Alb sau Fără fundal. **Formă**: Pătrat sau Rotund (doar cu fundal alb).
- **Revino la logo-ul inițial** = alb, pătrat.
- Iconița de pe ecranul telefonului se ia la instalare. Pentru o aplicație deja instalată,
  Chrome o actualizează singur în cel mult o zi (poate cere confirmare). Imediat: dezinstalează și instalează din nou.
- Unele telefoane (de ex. Samsung) pun iconițele într-o ramă proprie; asta se schimbă din setările ecranului de pornire.

Iconițele se regenerează din `assets/logo.png` cu `python3 scripts/make_icons.py`.
