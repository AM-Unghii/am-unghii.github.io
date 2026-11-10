# Instalare pe telefon (Android, Chrome)

Adresa: https://bogdanpaulmurar-hash.github.io/AM_Unghii/ (după mutare, vezi mai jos: https://am-unghii.github.io/)

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

Alte aplicații PWA de pe telefon nu se încurcă cu aceasta **doar dacă au altă adresă de bază** (alt `ceva.github.io`).
Două aplicații pe același `bogdanpaulmurar-hash.github.io` (de ex. DIiH și aceasta) se blochează între ele pe Android:
Chrome spune „instalată deja” și nu o deschide. Soluția e mai jos.

## Mai multe aplicații PWA pe același telefon (doar cu GitHub, gratuit)
Fiecare aplicație are nevoie de adresa ei: `nume.github.io`. Un cont GitHub are o singură astfel de adresă,
dar poți face gratuit oricâte **organizații** (fiecare are adresa ei). Abonamentul plătit nu schimbă asta.

0. Siguranță: în aplicație, Setări → **Sincronizează acum** și **Salvează tot în Excel**.
1. Fă organizația: https://github.com/account/organizations/new?plan=free → plan **Free**,
   nume de ex. `am-unghii` (adresa va fi `am-unghii.github.io`), „My personal account”.
2. Mută repo-ul: https://github.com/bogdanpaulmurar-hash/AM_Unghii/settings → jos, **Transfer** →
   proprietar nou `am-unghii` → confirmi.
3. (Recomandat) Redenumește repo-ul în `am-unghii.github.io` (Settings → General → Repository name).
   Adresa devine `https://am-unghii.github.io/`. Dacă nu-l redenumești, adresa e `https://am-unghii.github.io/AM_Unghii/` și merge la fel.
4. În repo-ul mutat: Settings → **Pages** → Source: **GitHub Actions**.
   Apoi Actions → „Publică versiunea web (PWA)” → **Run workflow**. După 2–3 minute adresa nouă merge.
5. Pe telefon: dezinstalează vechea „Programări”, deschide adresa nouă în Chrome → ⋮ → **Instalează aplicația**.
   Apoi poți reinstala și DIiH de pe adresa lui.
6. Pe adresa nouă aplicația pornește goală: Setări → Sincronizare → pui din nou adresa și parola → **Sincronizează acum**.
   Programările vin înapoi din Google Sheet.

Pentru încă o aplicație PWA: încă o organizație (de ex. `alta-aplicatie.github.io`), aceiași pași.

## Logo-ul (Setări → Logo-ul aplicației)
- **Fundal**: Alb sau Fără fundal. **Formă**: Pătrat sau Rotund (doar cu fundal alb).
- **Revino la logo-ul inițial** = alb, pătrat.
- Iconița de pe ecranul telefonului se ia la instalare. Pentru o aplicație deja instalată,
  Chrome o actualizează singur în cel mult o zi (poate cere confirmare). Imediat: dezinstalează și instalează din nou.
- Unele telefoane (de ex. Samsung) pun iconițele într-o ramă proprie; asta se schimbă din setările ecranului de pornire.

Iconițele se regenerează din `assets/logo.png` cu `python3 scripts/make_icons.py`.
