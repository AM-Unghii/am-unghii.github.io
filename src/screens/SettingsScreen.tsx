import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { NotifyVia, Procedure, ViewMode } from '../types';
import { colors, font, procedureColors, tint } from '../theme';
import { t } from '../i18n';
import { Btn, Chip, Hero, Input, Label, Row, Section, Sheet, useWide } from '../components/ui';
import { uid } from '../utils/date';
import { exportExcel, pickAndParseExcel } from '../services/excel';
import { DeviceCalendar, ensureCalendarPermission, listWritableCalendars } from '../services/calendar';
import { ensureNotificationPermission } from '../services/notifications';
import { logoImages, logoVariant } from '../services/appIcon';
import { defaultSettings } from '../store/storage';

const say = (msg: string) => (Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t.appName, msg));

export function SettingsScreen() {
  const { appointments, procedures, settings, updateSettings, saveProcedure, deleteProcedure, importAppointments, savedAt,
    syncConnected, syncStatus, syncError, lastSyncAt, syncNow, connectSync, disconnectSync, calendarError, sendTest } = useApp();
  const wide = useWide();
  const isWeb = Platform.OS === 'web';
  const [cals, setCals] = useState<DeviceCalendar[]>([]);
  const [gCalId, setGCalId] = useState(settings.googleCal.calendarId);
  const [notifMsg, setNotifMsg] = useState('');
  const [testing, setTesting] = useState(false);
  useEffect(() => { setGCalId(settings.googleCal.calendarId); }, [settings.googleCal.calendarId]);
  useEffect(() => {
    if (settings.notifyVia === 'device' && !isWeb) listWritableCalendars().then(setCals);
  }, [settings.notifyVia]);
  const [sUrl, setSUrl] = useState('');
  const [sKey, setSKey] = useState('');
  const [sBusy, setSBusy] = useState(false);
  const [sErr, setSErr] = useState('');
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [msg, setMsg] = useState('');
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const setVia = async (v: NotifyVia) => {
    setNotifMsg('');
    if (v === 'device') {
      if (!(await ensureCalendarPermission())) { say(t.settings.calendarDenied); return; }
      setCals(await listWritableCalendars());
    }
    if (v === 'app' && !isWeb && settings.reminderMinutes !== null) await ensureNotificationPermission();
    if (v === 'google' && !syncConnected) setNotifMsg(t.settings.needSync);
    updateSettings({ notifyVia: v });
  };

  const setReminder = async (v: number | null) => {
    if (v !== null && settings.notifyVia === 'app') await ensureNotificationPermission();
    updateSettings({ reminderMinutes: v });
  };

  const saveGoogle = (patch: Partial<typeof settings.googleCal>) => {
    updateSettings({ googleCal: { ...settings.googleCal, ...patch } });
    setNotifMsg(t.settings.googleSaved);
  };

  const doTest = async () => {
    setTesting(true); setNotifMsg('');
    try { setNotifMsg(await sendTest()); } finally { setTesting(false); }
  };

  const viaKeys: NotifyVia[] = isWeb ? ['google', 'app'] : ['app', 'device', 'google'];

  const doConnect = async () => {
    setSBusy(true); setSErr('');
    const err = await connectSync(sUrl, sKey);
    setSBusy(false);
    if (err) setSErr(err); else { setSUrl(''); setSKey(''); }
  };

  const doExport = async () => {
    try { const n = await exportExcel(appointments, procedures); setMsg(t.settings.exported(n)); }
    catch (e) { setMsg(String(e)); }
  };
  const doImport = async () => {
    try {
      const r = await pickAndParseExcel(procedures);
      if (!r) return;
      if (!r.appointments.length) { setMsg(t.settings.importFail); return; }
      const { added, updated } = importAppointments(r.appointments, r.newProcedures);
      setMsg(t.settings.imported(added, updated));
    } catch { setMsg(t.settings.importFail); }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <Hero title={t.settings.title} subtitle={t.settings.subtitle} />
      <View style={[{ paddingHorizontal: 16 }, wide && { paddingHorizontal: 24, maxWidth: 820, width: '100%', alignSelf: 'center' }]}>

      <Section icon="cloud-outline" title={t.sync.title} hint={t.sync.hint}>
        {syncConnected ? (
          <>
            <Row>
              <Ionicons name={syncStatus === 'error' ? 'cloud-offline' : syncStatus === 'syncing' ? 'sync' : 'cloud-done'} size={22}
                color={syncStatus === 'error' ? colors.danger : colors.success} />
              <Text style={[st.rowText, { marginLeft: 10 }]}>{syncStatus === 'ok' || syncStatus === 'idle' || syncStatus === 'syncing' || syncStatus === 'error' ? t.sync.status[syncStatus] : t.sync.connected}</Text>
            </Row>
            {syncError ? <Text style={[st.msg, { color: colors.danger }]}>{syncError}</Text> : null}
            {lastSyncAt ? <Text style={st.sub}>{t.sync.last}: {new Date(lastSyncAt).toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text> : null}
            <Btn kind="soft" icon="sync" label={t.sync.now} onPress={syncNow} style={{ marginTop: 12 }} disabled={syncStatus === 'syncing'} />
            <Btn kind="ghost" label={t.sync.disconnect} onPress={() => disconnectSync()} style={{ marginTop: 6 }} />
            <Text style={[st.sub, { marginTop: 8 }]}>{t.sync.calendarNote}</Text>
          </>
        ) : (
          <>
            <Text style={st.sub}>{t.sync.steps}</Text>
            <Label>{t.sync.url}</Label>
            <Input value={sUrl} onChangeText={setSUrl} autoCapitalize="none" autoCorrect={false} placeholder="https://script.google.com/macros/s/…/exec" />
            <Label>{t.sync.pass}</Label>
            <Input value={sKey} onChangeText={setSKey} autoCapitalize="none" autoCorrect={false} secureTextEntry />
            {sErr ? <Text style={[st.msg, { color: colors.danger }]}>{sErr}</Text> : null}
            <Btn icon="cloud-upload-outline" label={sBusy ? t.sync.connecting : t.sync.connect} onPress={doConnect} disabled={sBusy || !sUrl.trim()} style={{ marginTop: 14 }} />
          </>
        )}
      </Section>

      <Section icon="notifications-outline" title={t.settings.reminder} hint={t.settings.reminderHint}>
        <Row style={{ flexWrap: 'wrap' }}>
          {t.settings.reminderOpts.map((o) => (
            <Chip key={String(o.v)} small label={o.l} active={settings.reminderMinutes === o.v} onPress={() => setReminder(o.v)} />
          ))}
        </Row>
        <Label>{t.settings.via}</Label>
        {viaKeys.map((k) => {
          const on = settings.notifyVia === k;
          return (
            <Pressable key={k} onPress={() => setVia(k)} style={[st.opt, on && st.optOn]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
              <Ionicons name={k === 'app' ? 'phone-portrait-outline' : k === 'device' ? 'calendar-outline' : 'logo-google'} size={22} color={on ? colors.primary : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={[st.rowText, { fontSize: 16 }]}>{t.settings.viaOpts[k].l}</Text>
                <Text style={st.sub}>{t.settings.viaOpts[k].d}</Text>
              </View>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.primary : '#CFC3D2'} />
            </Pressable>
          );
        })}
        {isWeb && settings.notifyVia === 'app' ? <Text style={[st.sub, { marginTop: 8 }]}>{t.settings.webNotif}</Text> : null}

        {settings.notifyVia === 'device' && !isWeb ? (
          <>
            <Label>{t.settings.pickCalendar}</Label>
            {cals.length === 0 ? <Text style={st.sub}>{t.settings.noCalendars}</Text> : null}
            <Chip small label={t.settings.calAuto} active={!settings.deviceCalendarId} onPress={() => updateSettings({ deviceCalendarId: undefined })} />
            {cals.map((c) => (
              <Pressable key={c.id} onPress={() => updateSettings({ deviceCalendarId: c.id })} style={[st.calRow, settings.deviceCalendarId === c.id && st.optOn]} accessibilityRole="radio">
                <View style={[st.dot, { backgroundColor: c.color || colors.muted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={st.rowText} numberOfLines={1}>{c.title}</Text>
                  {c.account && c.account !== c.title ? <Text style={st.sub} numberOfLines={1}>{c.account}</Text> : null}
                </View>
                {settings.deviceCalendarId === c.id ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </>
        ) : null}

        {settings.notifyVia === 'google' ? (
          <>
            {!syncConnected ? <Text style={[st.msg, { color: colors.warn }]}>{t.settings.needSync}</Text> : null}
            <Label>{t.settings.googleCalId}</Label>
            <Input value={gCalId} onChangeText={setGCalId} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              placeholder="nume@gmail.com" onBlur={() => gCalId.trim() !== settings.googleCal.calendarId && saveGoogle({ calendarId: gCalId.trim() })} />
            <Text style={st.sub}>{t.settings.googleCalIdHint}</Text>
            <Row style={{ justifyContent: 'space-between', marginTop: 14 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={st.rowText}>{t.settings.emailToo}</Text>
                <Text style={st.sub}>{t.settings.emailTooHint}</Text>
              </View>
              <Switch value={settings.googleCal.email} onValueChange={(v) => saveGoogle({ email: v })} trackColor={{ true: colors.primary, false: '#DDD3DF' }} />
            </Row>
            {calendarError ? <Text style={[st.msg, { color: colors.danger }]}>{calendarError}</Text> : null}
            <Text style={[st.sub, { marginTop: 10 }]}>{t.settings.googleNeedsUpdate}</Text>
          </>
        ) : null}

        <Btn kind="soft" icon="notifications" label={testing ? '…' : t.settings.test} onPress={doTest} disabled={testing} style={{ marginTop: 16 }} />
        <Text style={[st.sub, { textAlign: 'center', marginTop: 6 }]}>{t.settings.testHint}</Text>
        {notifMsg ? <Text style={st.msg}>{notifMsg}</Text> : null}
      </Section>

      <Section icon="pricetag-outline" title={t.settings.prices} hint={t.settings.pricesHint}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.rowText}>{settings.usePrices ? t.settings.on : t.settings.off}</Text>
          <Switch value={settings.usePrices} onValueChange={(v) => updateSettings({ usePrices: v })} trackColor={{ true: colors.primary, false: '#DDD3DF' }} />
        </Row>
      </Section>

      <Section icon="sparkles-outline" title={t.settings.services} hint={t.settings.servicesHint}>
        {procedures.map((p, i) => (
          <Pressable key={p.id} onPress={() => setEditing(p)} style={[st.svc, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]} accessibilityRole="button">
            <View style={[st.dot, { backgroundColor: p.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={st.rowText}>{p.name}</Text>
              <Text style={st.sub}>{p.durationMin} {t.min}{settings.usePrices && p.price !== undefined ? ` · ${p.price} ${t.lei}` : ''}</Text>
            </View>
            <Ionicons name="create-outline" size={22} color={colors.muted} />
          </Pressable>
        ))}
        <Btn kind="soft" icon="add" label={t.settings.addService} style={{ marginTop: 12 }}
          onPress={() => setEditing({ id: 'p-' + uid(), name: '', durationMin: 60, color: procedureColors[procedures.length % procedureColors.length] })} />
      </Section>

      <Section icon="eye-outline" title={t.settings.defaultView}>
        <Row style={{ flexWrap: 'wrap' }}>
          {(['zi', '3zile', 'saptamana', 'luna'] as ViewMode[]).map((v) => (
            <Chip key={v} small label={t.views[v]} active={settings.defaultView === v} onPress={() => updateSettings({ defaultView: v })} />
          ))}
        </Row>
        <Label>{t.settings.dayStart}</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {hours.slice(0, 13).map((h) => <Chip key={h} small label={`${String(h).padStart(2, '0')}:00`} active={settings.dayStartHour === h} onPress={() => updateSettings({ dayStartHour: Math.min(h, settings.dayEndHour - 1) })} />)}
        </ScrollView>
        <Label>{t.settings.dayEnd}</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {hours.slice(12).map((h) => <Chip key={h} small label={`${String(h).padStart(2, '0')}:00`} active={settings.dayEndHour === h} onPress={() => updateSettings({ dayEndHour: Math.max(h, settings.dayStartHour + 1) })} />)}
        </ScrollView>
      </Section>

      <Section icon="image-outline" title={t.settings.logo} hint={t.settings.logoHint}>
        <View style={st.logoBox}>
          <Image source={logoImages[logoVariant(settings.logoBg, settings.logoShape)]} style={st.logoImg} resizeMode="contain"
            accessibilityLabel={t.settings.logo} />
        </View>
        <Label>{t.settings.logoBg}</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {(['alb', 'transparent'] as const).map((v) => (
            <Chip key={v} small label={t.settings.logoBgOpts[v]} active={settings.logoBg === v} onPress={() => updateSettings({ logoBg: v })} />
          ))}
        </Row>
        <Label>{t.settings.logoShape}</Label>
        {settings.logoBg === 'alb' ? (
          <Row style={{ flexWrap: 'wrap' }}>
            {(['patrat', 'rotund'] as const).map((v) => (
              <Chip key={v} small label={t.settings.logoShapeOpts[v]} active={settings.logoShape === v} onPress={() => updateSettings({ logoShape: v })} />
            ))}
          </Row>
        ) : <Text style={st.sub}>{t.settings.logoShapeNoBg}</Text>}
        <Btn kind="ghost" icon="refresh" label={t.settings.logoReset} style={{ marginTop: 10 }}
          disabled={settings.logoBg === defaultSettings.logoBg && settings.logoShape === defaultSettings.logoShape}
          onPress={() => updateSettings({ logoBg: defaultSettings.logoBg, logoShape: defaultSettings.logoShape })} />
        <Text style={[st.sub, { marginTop: 8 }]}>{Platform.OS === 'web' ? t.settings.logoNote : t.settings.logoNoteNative}</Text>
      </Section>

      <Section icon="shield-checkmark-outline" title={t.settings.data} hint={t.settings.dataHint}>
        <Btn icon="download-outline" label={t.settings.exportExcel} onPress={doExport} />
        <Btn kind="soft" icon="cloud-upload-outline" label={t.settings.importExcel} onPress={doImport} style={{ marginTop: 10 }} />
        {msg ? <Text style={st.msg}>{msg}</Text> : null}
        <Text style={st.sub}>{appointments.length} programări salvate{savedAt ? ` · ${t.settings.lastSave}: ${new Date(savedAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}` : ''}</Text>
      </Section>

      <ServiceSheet proc={editing} usePrices={settings.usePrices} canDelete={procedures.length > 1}
        onClose={() => setEditing(null)} onSave={(p) => { saveProcedure(p); setEditing(null); }} onDelete={(id) => { deleteProcedure(id); setEditing(null); }} />
      </View>
    </ScrollView>
  );
}

function ServiceSheet({ proc, usePrices, canDelete, onClose, onSave, onDelete }: {
  proc: Procedure | null; usePrices: boolean; canDelete: boolean; onClose: () => void; onSave: (p: Procedure) => void; onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [dur, setDur] = useState(60);
  const [price, setPrice] = useState('');
  const [color, setColor] = useState(procedureColors[0]);
  React.useEffect(() => {
    if (proc) { setName(proc.name); setDur(proc.durationMin); setPrice(proc.price !== undefined ? String(proc.price) : ''); setColor(proc.color); }
  }, [proc]);
  if (!proc) return null;
  const pr = price.trim() ? Number(price.replace(',', '.')) : undefined;
  return (
    <Sheet visible onClose={onClose} title={t.settings.services}>
      <Label>{t.settings.serviceName}</Label>
      <Input value={name} onChangeText={setName} autoFocus={!proc.name} />
      <Label>{t.duration}</Label>
      <Row style={{ flexWrap: 'wrap' }}>
        {[30, 45, 60, 90, 120, 150].map((d) => <Chip key={d} small label={`${d} ${t.min}`} active={d === dur} onPress={() => setDur(d)} />)}
      </Row>
      {usePrices ? (<><Label>{t.settings.servicePrice}</Label><Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" /></>) : null}
      <Label>Culoare</Label>
      <Row>
        {procedureColors.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={[st.swatch, { backgroundColor: c }, c === color && st.swatchOn]} accessibilityLabel={c} />
        ))}
      </Row>
      <Btn label={t.save} icon="checkmark" style={{ marginTop: 24 }} disabled={!name.trim()}
        onPress={() => onSave({ ...proc, name: name.trim(), durationMin: dur, price: pr !== undefined && Number.isFinite(pr) ? pr : undefined, color })} />
      {canDelete ? <Btn kind="danger" icon="trash-outline" label={t.settings.delService} style={{ marginTop: 10 }} onPress={() => onDelete(proc.id)} /> : null}
    </Sheet>
  );
}

const st = StyleSheet.create({
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.line, marginBottom: 8, backgroundColor: '#fff' },
  optOn: { borderColor: colors.primary, backgroundColor: tint(colors.primary, 0.05) },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.line, marginBottom: 6 },
  sec: { fontSize: 15, ...font.w800, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  hint: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20, ...font.reg },
  rowText: { fontSize: 17, ...font.w600, color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2, ...font.reg },
  svc: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  msg: { marginTop: 12, color: colors.primaryDark, ...font.w700, fontSize: 15 },
  swatch: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 3, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.ink },
  logoBox: { alignSelf: 'center', padding: 14, borderRadius: 22, backgroundColor: colors.plum },
  logoImg: { width: 140, height: 140 },
});
