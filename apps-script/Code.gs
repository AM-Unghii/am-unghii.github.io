/**
 * Programări Unghii — server de sincronizare (Google Apps Script).
 * Se lipește în Google Sheet: Extensii → Apps Script. Vezi docs/SINCRONIZARE.md
 *
 * 1) Schimbă PAROLA de mai jos cu o parolă a ta (o vei scrie în aplicație).
 * 2) Implementare → Implementare nouă → Aplicație web:
 *      Execută ca: Eu     |     Cine are acces: Oricine
 * 3) (opțional) Google Calendar: dacă în aplicație alegi „Google Calendar (prin sincronizare)”,
 *    scriptul pune programările în calendarul tău, cu notificare. La prima publicare Google
 *    îți cere și permisiunea pentru Calendar.
 */
var PAROLA = 'schimba-ma';

var SHEET_NAME = 'Programări';
var HEAD = ['id', 'data', 'ora', 'durata_min', 'nume', 'telefon', 'procedura_id', 'procedura', 'pret',
            'observatii', 'status', 'creat', 'modificat', 'sters', 'server_mod', 'eveniment_calendar', 'calendar_sync', 'reprogramari'];
var C_EVENT = 15, C_CALSYNC = 16, C_RESCH = 17;
var MAX_CAL_PER_CALL = 30; // ca un apel să nu dureze prea mult; restul se face la următoarea sincronizare

function doGet() {
  return json_({ ok: true, name: 'Programari Unghii', hint: 'Scriptul functioneaza.' });
}

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.key !== PAROLA) return json_({ ok: false, error: 'parola' });
    var lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try { out = handle_(req); } finally { lock.releaseLock(); }
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return json_(out);
}

function handle_(req) {
  var sh = sheet_();
  var now = Date.now();
  var last = sh.getLastRow();
  var values = last > 1 ? sh.getRange(2, 1, last - 1, HEAD.length).getValues() : [];
  var index = {};
  values.forEach(function (r, i) { index[String(r[0])] = i; });
  var changed = false;

  (req.appointments || []).forEach(function (a) {
    if (!a || !a.id) return;
    var i = index[a.id];
    if (i !== undefined) {
      if (String(a.updatedAt) <= String(values[i][12])) return; // varianta din Sheet e mai noua
      values[i] = toRow_(a, now, values[i]);
    } else {
      index[a.id] = values.length;
      values.push(toRow_(a, now));
    }
    changed = true;
  });

  // Google Calendar: setarea comună (cea mai recentă câștigă) + evenimentele
  var cfg = config_();
  var cal = calendarConfig_(cfg, req.calendar);
  var calendarError = '';
  try {
    if (req.test && cal.on) testEvent_(cal);
    if (calendarWork_(values, cal)) changed = true;
  } catch (err) {
    calendarError = 'Google Calendar: ' + String(err && err.message || err);
  }

  if (changed) sh.getRange(2, 1, values.length, HEAD.length).setValues(values);

  var since = Number(req.since) || 0;
  var outAppts = [];
  values.forEach(function (r) {
    if (Number(r[14]) >= since) outAppts.push(toAppt_(r));
  });

  // lista de servicii: cea mai recenta castiga
  var pu = String(cfg.getRange('C1').getValue() || '');
  if (req.procedures && req.procedures.updatedAt && String(req.procedures.updatedAt) > pu) {
    cfg.getRange('B1').setValue(JSON.stringify(req.procedures.list || []));
    cfg.getRange('C1').setValue(String(req.procedures.updatedAt));
    pu = String(req.procedures.updatedAt);
  }
  var list = [];
  try { list = JSON.parse(cfg.getRange('B1').getValue() || '[]'); } catch (e) { list = []; }

  var out = { ok: true, serverTime: now, appointments: outAppts, procedures: { list: list, updatedAt: pu }, calendar: cal };
  if (calendarError) out.calendarError = calendarError;
  return out;
}

function toRow_(a, now, old) {
  return [a.id, a.date, a.time, a.durationMin, a.clientName, a.phone || '', a.procedureId || '', a.procedureName || '',
          (a.price === undefined || a.price === null) ? '' : a.price, a.notes || '', a.status || 'programat',
          a.createdAt || '', a.updatedAt || '', a.deleted ? 'DA' : '', now,
          old ? (old[C_EVENT] || '') : '', old ? (old[C_CALSYNC] || '') : '',
          (a.reschedules && a.reschedules.length) ? JSON.stringify(a.reschedules) : ''];
}

// ---------------- Google Calendar ----------------

/** Citește setarea din Config!D1; o înlocuiește dacă aplicația a trimis una mai nouă. */
function calendarConfig_(cfg, incoming) {
  var cur = { on: false, calendarId: '', email: false, reminder: 60, updatedAt: '' };
  try { var j = JSON.parse(cfg.getRange('D1').getValue() || '{}'); if (j && j.updatedAt !== undefined) cur = j; } catch (e) {}
  if (incoming && incoming.updatedAt && String(incoming.updatedAt) > String(cur.updatedAt || '')) {
    var changedTarget = String(incoming.calendarId || '') !== String(cur.calendarId || '') || !!incoming.email !== !!cur.email ||
      incoming.reminder !== cur.reminder || !!incoming.on !== !!cur.on;
    cur = { on: !!incoming.on, calendarId: String(incoming.calendarId || ''), email: !!incoming.email,
            reminder: (incoming.reminder === null || incoming.reminder === undefined) ? null : Number(incoming.reminder),
            updatedAt: String(incoming.updatedAt), version: changedTarget ? String(incoming.updatedAt) : (cur.version || '') };
    cfg.getRange('D1').setValue(JSON.stringify(cur));
  }
  return cur;
}

function targetCalendar_(cal) {
  var c = cal.calendarId ? CalendarApp.getCalendarById(cal.calendarId) : CalendarApp.getDefaultCalendar();
  if (!c) throw new Error('nu găsesc calendarul „' + cal.calendarId + '”. Verifică adresa (sau las-o goală).');
  return c;
}

function apptDate_(date, time) {
  var d = String(date).split('-'), t = String(time).split(':');
  return new Date(Number(d[0]), Number(d[1]) - 1, Number(d[2]), Number(t[0]), Number(t[1]), 0);
}

function deleteEvent_(id) {
  if (!id) return;
  try { var ev = CalendarApp.getEventById(String(id)); if (ev) ev.deleteEvent(); } catch (e) {}
}

/**
 * Pune / actualizează / șterge evenimentele în Google Calendar.
 * Un rând trebuie lucrat dacă s-a modificat de la ultima scriere în calendar (coloana calendar_sync)
 * sau dacă s-a schimbat setarea (calendar, memento, e-mail). Întoarce true dacă a modificat rânduri.
 */
function calendarWork_(values, cal) {
  var touched = false, work = 0;
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var target = null;
  var mark = function (r) { return String(r[12]) + '|' + (cal.version || cal.updatedAt || ''); };
  for (var i = 0; i < values.length && work < MAX_CAL_PER_CALL; i++) {
    var r = values[i];
    var evId = String(r[C_EVENT] || '');
    var gone = String(r[13]) === 'DA' || String(r[10]) === 'anulat';
    if (!cal.on) {
      continue; // oprit: nu mai atingem calendarul
    }
    if (gone) {
      if (evId) { deleteEvent_(evId); r[C_EVENT] = ''; r[C_CALSYNC] = ''; touched = true; work++; }
      continue;
    }
    if (String(r[1]) < today) continue; // trecutul rămâne cum e
    if (String(r[C_CALSYNC]) === mark(r) && evId) continue; // deja la zi
    if (!target) target = targetCalendar_(cal);
    var start = apptDate_(r[1], r[2]);
    var end = new Date(start.getTime() + (Number(r[3]) || 60) * 60000);
    var title = String(r[4]) + ' · ' + String(r[7]);
    var desc = [r[5] ? 'Tel: ' + r[5] : '', r[9] ? String(r[9]) : '', '#am-' + r[0]].filter(String).join('\n');
    var ev = null;
    if (evId) {
      try { ev = CalendarApp.getEventById(evId); } catch (e) { ev = null; }
      if (ev && ev.getOriginalCalendarId && ev.getOriginalCalendarId() !== target.getId()) { ev.deleteEvent(); ev = null; }
    }
    if (ev) { ev.setTitle(title); ev.setTime(start, end); ev.setDescription(desc); }
    else ev = target.createEvent(title, start, end, { description: desc });
    ev.removeAllReminders();
    if (cal.reminder !== null && cal.reminder !== undefined) {
      ev.addPopupReminder(Math.min(40320, Number(cal.reminder)));
      if (cal.email) ev.addEmailReminder(Math.min(40320, Number(cal.reminder)));
    }
    r[C_EVENT] = ev.getId();
    r[C_CALSYNC] = mark(r);
    touched = true; work++;
  }
  return touched;
}

/** Eveniment de test peste 3 minute, cu notificare la început. */
function testEvent_(cal) {
  var start = new Date(Date.now() + 3 * 60000);
  var ev = targetCalendar_(cal).createEvent('Test notificare · A.M. Unghii', start, new Date(start.getTime() + 15 * 60000),
    { description: 'Notificările funcționează. Poți șterge acest eveniment.' });
  ev.removeAllReminders();
  ev.addPopupReminder(0);
  if (cal.email) ev.addEmailReminder(0);
}

/** Rulează o dată din editor (▶) ca Google să ceară permisiunea pentru Calendar. */
function autorizeazaCalendar() {
  Logger.log(CalendarApp.getDefaultCalendar().getName());
}

function toAppt_(r) {
  var a = {
    id: String(r[0]), date: String(r[1]), time: String(r[2]), durationMin: Number(r[3]) || 60,
    clientName: String(r[4]), procedureId: String(r[6]), procedureName: String(r[7]),
    status: String(r[10]) || 'programat', createdAt: String(r[11]), updatedAt: String(r[12]),
    deleted: String(r[13]) === 'DA'
  };
  if (r[5] !== '') a.phone = String(r[5]);
  if (r[8] !== '' && r[8] !== null) a.price = Number(r[8]);
  if (r[9] !== '') a.notes = String(r[9]);
  if (r[C_RESCH]) { try { a.reschedules = JSON.parse(r[C_RESCH]); } catch (e) {} }
  return a;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (String(sh.getRange(1, HEAD.length).getValue()) !== HEAD[HEAD.length - 1]) {
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold'); // coloane noi (calendar, reprogramări)
  }
  // text simplu, ca Google sa nu transforme datele/orele/telefoanele
  ['B:C', 'F:F', 'L:M', 'P:R'].forEach(function (c) { sh.getRange(c).setNumberFormat('@'); });
  return sh;
}

function config_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Config');
  if (!sh) {
    sh = ss.insertSheet('Config');
    sh.getRange('A1').setValue('servicii');
    sh.getRange('C1').setNumberFormat('@');
    sh.hideSheet();
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
