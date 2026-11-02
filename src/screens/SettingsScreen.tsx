import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { Procedure, ViewMode } from '../types';
import { colors, procedureColors } from '../theme';
import { t } from '../i18n';
import { Btn, Card, Chip, Input, Label, Row, Sheet } from '../components/ui';
import { uid } from '../utils/date';
import { exportExcel, pickAndParseExcel } from '../services/excel';
import { ensureCalendarPermission } from '../services/calendar';
import { ensureNotificationPermission } from '../services/notifications';

const say = (msg: string) => (Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t.appName, msg));

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={st.sec}>{title}</Text>
      {hint ? <Text style={st.hint}>{hint}</Text> : null}
      <Card style={{ marginTop: 10 }}>{children}</Card>
    </View>
  );
}

export function SettingsScreen() {
  const { appointments, procedures, settings, updateSettings, saveProcedure, deleteProcedure, importAppointments, savedAt,
    syncConnected, syncStatus, syncError, lastSyncAt, syncNow, connectSync, disconnectSync } = useApp();
  const [sUrl, setSUrl] = useState('');
  const [sKey, setSKey] = useState('');
  const [sBusy, setSBusy] = useState(false);
  const [sErr, setSErr] = useState('');
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [msg, setMsg] = useState('');
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const toggleCalendar = async (on: boolean) => {
    if (on && Platform.OS === 'web') { say(t.settings.calendarWeb); return; }
    if (on && !(await ensureCalendarPermission())) { say(t.settings.calendarDenied); return; }
    updateSettings({ syncDeviceCalendar: on });
  };

  const setReminder = async (v: number | null) => {
    if (v !== null) await ensureNotificationPermission();
    updateSettings({ reminderMinutes: v });
  };

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
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <Text style={st.h1}>{t.settings.title}</Text>

      <Section title={t.sync.title} hint={t.sync.hint}>
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

      <Section title={t.settings.prices} hint={t.settings.pricesHint}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.rowText}>{settings.usePrices ? 'Pornit' : 'Oprit'}</Text>
          <Switch value={settings.usePrices} onValueChange={(v) => updateSettings({ usePrices: v })} trackColor={{ true: colors.primary, false: '#DDD3DF' }} />
        </Row>
      </Section>

      <Section title={t.settings.services} hint={t.settings.servicesHint}>
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

      <Section title={t.settings.reminder} hint={Platform.OS === 'web' ? t.settings.webNotif : t.settings.reminderHint}>
        <Row style={{ flexWrap: 'wrap' }}>
          {t.settings.reminderOpts.map((o) => (
            <Chip key={String(o.v)} small label={o.l} active={settings.reminderMinutes === o.v} onPress={() => setReminder(o.v)} />
          ))}
        </Row>
      </Section>

      <Section title={t.settings.calendar} hint={Platform.OS === 'web' ? t.settings.calendarWeb : t.settings.calendarHint}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.rowText}>{settings.syncDeviceCalendar ? 'Pornit' : 'Oprit'}</Text>
          <Switch value={settings.syncDeviceCalendar} onValueChange={toggleCalendar} trackColor={{ true: colors.primary, false: '#DDD3DF' }} />
        </Row>
      </Section>

      <Section title={t.settings.defaultView}>
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

      <Section title={t.settings.data} hint={t.settings.dataHint}>
        <Btn icon="download-outline" label={t.settings.exportExcel} onPress={doExport} />
        <Btn kind="soft" icon="cloud-upload-outline" label={t.settings.importExcel} onPress={doImport} style={{ marginTop: 10 }} />
        {msg ? <Text style={st.msg}>{msg}</Text> : null}
        <Text style={st.sub}>{appointments.length} programări salvate{savedAt ? ` · ${t.settings.lastSave}: ${new Date(savedAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}` : ''}</Text>
      </Section>

      <ServiceSheet proc={editing} usePrices={settings.usePrices} canDelete={procedures.length > 1}
        onClose={() => setEditing(null)} onSave={(p) => { saveProcedure(p); setEditing(null); }} onDelete={(id) => { deleteProcedure(id); setEditing(null); }} />
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
  h1: { fontSize: 30, fontWeight: '800', color: colors.ink },
  sec: { fontSize: 15, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  hint: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  rowText: { fontSize: 17, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  svc: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  msg: { marginTop: 12, color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  swatch: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 3, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.ink },
});
