# Sincronizare între dispozitive (Google Sheet) — pas cu pas

Se face **o singură dată** (5 minute). Datele rămân în contul tău Google.

## A. Pregătești Google Sheet-ul
1. Deschide https://sheets.new (se creează un Sheet gol). Numește-l „Programări Unghii”.
2. Meniu **Extensii → Apps Script**.
3. Șterge tot ce e în editor și lipește tot conținutul fișierului `apps-script/Code.gs` din acest repo.
4. În prima linie de cod schimbă `var PAROLA = 'schimba-ma';` cu o parolă a ta (fără ghilimele în parolă). Ține-o minte.
5. Apasă **Salvează** (discheta).

## B. Publici scriptul
1. Sus-dreapta: **Implementare → Implementare nouă**.
2. La roata dințată alege **Aplicație web**.
3. **Execută ca:** *Eu* · **Cine are acces:** *Oricine*.
4. **Implementează**. Google cere permisiuni → *Autorizează accesul* → alege contul → „Advanced / Avansat” → „Go to … (unsafe) / Deschide …” → *Permite*. (Apare avertismentul pentru că scriptul e al tău și nu e verificat de Google — e normal.)
5. Copiază **adresa aplicației web** (începe cu `https://script.google.com/macros/s/…/exec`).

> Dacă mai târziu modifici codul scriptului: Implementare → *Gestionează implementările* → creion → Versiune nouă → Implementează.

## C. Conectezi dispozitivele
Pe **fiecare** dispozitiv (telefon, tabletă, calculator): aplicația → **Setări → Sincronizare** → lipești adresa și parola → **Conectează**.

Gata: programările apar identic peste tot. Modificările pleacă în câteva secunde, iar aplicația verifică singură la 1 minut și când o deschizi.

## Reguli
- Dacă aceeași programare e modificată pe două dispozitive, rămâne **modificarea cea mai recentă**.
- Ștergerile se sincronizează. Nimic nu dispare dacă nu ștergi tu.
- Fără internet aplicația merge normal; se sincronizează când revine netul.
- Lista de servicii (Manichiură etc.) se sincronizează; **setările** (prețuri, memento, calendar) rămân pe fiecare dispozitiv.
- Poți deschide Sheet-ul oricând ca să vezi toate programările (foaia „Programări”). **Nu modifica manual** coloanele `id`, `modificat` și `server_mod`.
- Parola nu e criptare puternică: cine are adresa **și** parola poate citi datele. Nu le da nimănui.
