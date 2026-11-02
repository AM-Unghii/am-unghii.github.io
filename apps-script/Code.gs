/**
 * Programări Unghii — server de sincronizare (Google Apps Script).
 * Se lipește în Google Sheet: Extensii → Apps Script. Vezi docs/SINCRONIZARE.md
 *
 * 1) Schimbă PAROLA de mai jos cu o parolă a ta (o vei scrie în aplicație).
 * 2) Implementare → Implementare nouă → Aplicație web:
 *      Execută ca: Eu     |     Cine are acces: Oricine
 */
var PAROLA = 'schimba-ma';

var SHEET_NAME = 'Programări';
var HEAD = ['id', 'data', 'ora', 'durata_min', 'nume', 'telefon', 'procedura_id', 'procedura', 'pret',
            'observatii', 'status', 'creat', 'modificat', 'sters', 'server_mod'];

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
      values[i] = toRow_(a, now);
    } else {
      index[a.id] = values.length;
      values.push(toRow_(a, now));
    }
    changed = true;
  });
  if (changed) sh.getRange(2, 1, values.length, HEAD.length).setValues(values);

  var since = Number(req.since) || 0;
  var outAppts = [];
  values.forEach(function (r) {
    if (Number(r[14]) >= since) outAppts.push(toAppt_(r));
  });

  // lista de servicii: cea mai recenta castiga
  var cfg = config_();
  var pu = String(cfg.getRange('C1').getValue() || '');
  if (req.procedures && req.procedures.updatedAt && String(req.procedures.updatedAt) > pu) {
    cfg.getRange('B1').setValue(JSON.stringify(req.procedures.list || []));
    cfg.getRange('C1').setValue(String(req.procedures.updatedAt));
    pu = String(req.procedures.updatedAt);
  }
  var list = [];
  try { list = JSON.parse(cfg.getRange('B1').getValue() || '[]'); } catch (e) { list = []; }

  return { ok: true, serverTime: now, appointments: outAppts, procedures: { list: list, updatedAt: pu } };
}

function toRow_(a, now) {
  return [a.id, a.date, a.time, a.durationMin, a.clientName, a.phone || '', a.procedureId || '', a.procedureName || '',
          (a.price === undefined || a.price === null) ? '' : a.price, a.notes || '', a.status || 'programat',
          a.createdAt || '', a.updatedAt || '', a.deleted ? 'DA' : '', now];
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
  return a;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  // text simplu, ca Google sa nu transforme datele/orele/telefoanele
  ['B:C', 'F:F', 'L:M'].forEach(function (c) { sh.getRange(c).setNumberFormat('@'); });
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
