import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppContext';
import { Appointment } from '../types';
import { colors, font, gradients, initials, shadow, tint } from '../theme';
import { t } from '../i18n';
import { addDays, cap, dayNum, dowIndex, endTime, fromMin, monthYear, shortDate, startOfWeek, toISO, toMin } from '../utils/date';
import { apptName, isAllDay } from '../utils/appts';
import { useWide } from '../components/ui';
import { apptSub, procColor } from '../components/ApptRow';
import { AppointmentSheet, SheetTarget } from '../components/AppointmentSheet';

export type HomeGo = 'program' | 'list' | 'reports' | 'settings';

/** Ora curentă, reîmprospătată la fiecare 30 s (pentru linia „acum” și „în X min”). */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Împarte programările care se suprapun pe „benzi”, ca să nu se acopere una pe alta. */
function lanes(list: Appointment[]) {
  const sorted = [...list].sort((a, b) => a.time.localeCompare(b.time));
  const out = new Map<string, { lane: number; of: number }>();
  let group: Appointment[] = [];
  let groupEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => { group.forEach((a) => { out.get(a.id)!.of = laneEnds.length; }); group = []; laneEnds = []; };
  for (const a of sorted) {
    const s = toMin(a.time), e = s + a.durationMin;
    if (s >= groupEnd) { flush(); groupEnd = -1; }
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane < 0) { lane = laneEnds.length; laneEnds.push(e); } else laneEnds[lane] = e;
    out.set(a.id, { lane, of: 1 });
    group.push(a);
    groupEnd = Math.max(groupEnd, e);
  }
  flush();
  return out;
}

function StatusPill({ a, isNext }: { a: Appointment; isNext?: boolean }) {
  if (a.status === 'finalizat') return <Text style={[st.pill, { backgroundColor: tint(colors.success, 0.12), color: colors.success }]}>{t.statuses.finalizat}</Text>;
  if (a.status === 'anulat') return <Text style={[st.pill, { backgroundColor: tint(colors.danger, 0.1), color: colors.danger }]}>{t.statuses.anulat}</Text>;
  if (isNext) return <Text style={[st.pill, { backgroundColor: colors.goldSoft, color: '#8E6A33' }]}>{t.panel.next}</Text>;
  return null;
}

export function HomeScreen({ go, onDay }: { go: (tab: HomeGo) => void; onDay: (iso: string) => void }) {
  const { appointments, procedures, settings } = useApp();
  const wide = useWide();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const today = toISO(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const d = useMemo(() => {
    const todays = appointments.filter((a) => a.date === today).sort((x, y) => x.time.localeCompare(y.time));
    const allDay = todays.filter(isAllDay);
    const timed = todays.filter((a) => !isAllDay(a));
    const clients = todays.filter((a) => !a.personal);
    const live = timed.filter((a) => a.status !== 'anulat');
    const busy = live.reduce((s, a) => s + a.durationMin, 0);
    const lastEnd = live.reduce((m, a) => Math.max(m, toMin(a.time) + a.durationMin), 0);
    const firstStart = live.length ? toMin(live[0].time) : 0;
    // următoarea: prima programare activă care nu s-a terminat încă (azi sau mai târziu)
    const next = appointments
      .filter((a) => a.status === 'programat' && !isAllDay(a) && (a.date > today || (a.date === today && toMin(a.time) + a.durationMin > nowMin)))
      .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))[0];
    const weekStart = startOfWeek(today);
    const week = Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(weekStart, i);
      const list = appointments.filter((a) => a.date === iso && a.status !== 'anulat');
      return { iso, count: list.filter((a) => !a.personal).length, any: list.length > 0 };
    });
    // intervalul orar: de la prima la ultima programare (ore întregi), plus ora curentă dacă e în programul de lucru
    let start = 24 * 60, end = 0;
    timed.forEach((a) => { start = Math.min(start, Math.floor(toMin(a.time) / 60) * 60); end = Math.max(end, Math.ceil((toMin(a.time) + a.durationMin) / 60) * 60); });
    if (nowMin >= settings.dayStartHour * 60 && nowMin < settings.dayEndHour * 60) {
      start = Math.min(start, Math.floor(nowMin / 60) * 60);
      end = Math.max(end, Math.ceil((nowMin + 1) / 60) * 60);
    }
    if (end <= start) { start = settings.dayStartHour * 60; end = settings.dayEndHour * 60; }
    if (end - start < 240) end = Math.min(24 * 60, start + 240);
    return {
      allDay, timed, lanes: lanes(timed), next, week, start, end,
      count: clients.filter((a) => a.status !== 'anulat').length,
      done: clients.filter((a) => a.status === 'finalizat').length,
      cancelled: clients.filter((a) => a.status === 'anulat').length,
      busy, lastEnd, firstStart,
    };
  }, [appointments, today, nowMin, settings.dayStartHour, settings.dayEndHour]);

  const openNew = () => setTarget({ date: today });
  const openAppt = (a: Appointment) => setTarget({ appt: a });
  const hour = now.getHours();
  const greet = hour < 12 ? t.greet.morning : hour < 18 ? t.greet.day : t.greet.evening;
  const weekday = cap(t.days[dowIndex(today)]);
  const summary = [t.apptToday(d.count), d.cancelled ? t.home.cancelledN(d.cancelled) : ''].filter(Boolean).join(' · ');
  const dayHint = d.timed.some((a) => a.status !== 'anulat') ? `${t.home.busy(d.busy)} · ${t.home.freeFrom(fromMin(d.lastEnd))}` : '';

  // ---------- piese comune ----------
  const nextWhen = (a: Appointment) => {
    if (a.date === today) {
      const s = toMin(a.time);
      return s <= nowMin ? t.home.ongoing : t.home.inMin(s - nowMin);
    }
    if (a.date === addDays(today, 1)) return t.home.tomorrow;
    return shortDate(a.date);
  };

  const nextCard = (style?: ViewStyle) => {
    const a = d.next;
    if (!a) {
      return (
        <View style={[st.next, style]}>
          <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.nextBar} />
          <Text style={st.nextLbl}>{t.home.nextTitle}</Text>
          <Text style={[st.nextName, { marginTop: 10, fontSize: 18 }]}>{t.home.none}</Text>
          <Text style={st.nextSub}>{t.home.noneHint}</Text>
        </View>
      );
    }
    const c = procColor(a, procedures);
    return (
      <Pressable onPress={() => openAppt(a)} accessibilityRole="button" style={({ hovered }: any) => [st.next, style, hovered && { transform: [{ translateY: -1 }] }]}>
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.nextBar} />
        <View style={st.nextTop}>
          <Text style={st.nextLbl}>{t.home.nextTitle}</Text>
          <Text style={st.nextIn}>{nextWhen(a)}</Text>
        </View>
        <View style={st.nextMain}>
          <View style={[st.av, { backgroundColor: c }]}>
            {a.personal ? <Ionicons name="person" size={20} color="#fff" /> : <Text style={st.avText}>{initials(a.clientName) || '•'}</Text>}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.nextName} numberOfLines={1}>{apptName(a)}</Text>
            <Text style={st.nextSub} numberOfLines={1}>{apptSub(a)} · {a.durationMin} min</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={st.nextTime}>{a.time}</Text>
            <Text style={st.nextUntil}>{t.until} {endTime(a.time, a.durationMin)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const allDayBands = d.allDay.map((a) => {
    const c = procColor(a, procedures);
    return (
      <Pressable key={a.id} onPress={() => openAppt(a)} accessibilityRole="button" style={[st.allDay, { backgroundColor: tint(c, 0.12), borderColor: tint(c, 0.5) }]}>
        <Text style={[st.allDayText, { color: c }, a.status === 'anulat' && st.strike]} numberOfLines={1}>{t.period.allDay} · {apptName(a)}</Text>
        {a.personal ? <Text style={[st.pill, { backgroundColor: tint(c, 0.16), color: c }]}>{t.personal.badge}</Text> : null}
      </Pressable>
    );
  });

  const block = (a: Appointment, horizontal: boolean) => {
    const c = procColor(a, procedures);
    const cancelled = a.status === 'anulat';
    const isNext = d.next?.id === a.id;
    const span = d.end - d.start;
    const s = toMin(a.time) - d.start;
    const ln = d.lanes.get(a.id) || { lane: 0, of: 1 };
    const pos: ViewStyle = horizontal
      ? { left: `${(s / span) * 100}%`, width: `${(a.durationMin / span) * 100}%`, top: `${(ln.lane / ln.of) * 100}%`, height: `${100 / ln.of}%` }
      : { top: s * PX, height: Math.max(a.durationMin * PX - 4, 26), left: `${(ln.lane / ln.of) * 100}%`, width: `${100 / ln.of}%` };
    const small = !horizontal && a.durationMin * PX < 44;
    return (
      <View key={a.id} style={[st.blkWrap, pos]}>
        <Pressable onPress={() => openAppt(a)} accessibilityRole="button" accessibilityLabel={`${a.time} ${apptName(a)}`}
          style={({ hovered }: any) => [
            st.blk, horizontal ? { borderTopWidth: 4, borderTopColor: c } : { borderLeftWidth: 4, borderLeftColor: c },
            { backgroundColor: tint(c, 0.12) },
            a.personal && { borderStyle: 'dashed', borderWidth: 1, borderColor: tint(c, 0.6) },
            cancelled && st.blkCancelled,
            a.status === 'finalizat' && { opacity: 0.7 },
            isNext && st.blkNext,
            hovered && { borderColor: tint(c, 0.9) },
          ]}>
          <View style={[st.blkTop, horizontal && { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={[st.blkTime, { color: cancelled ? colors.muted : c }]} numberOfLines={1}>{a.time}–{endTime(a.time, a.durationMin)}</Text>
            {!small ? <StatusPill a={a} isNext={isNext} /> : null}
          </View>
          <Text style={[st.blkName, cancelled && st.strike]} numberOfLines={1}>
            {a.personal ? <Ionicons name="person" size={12} color={c} /> : null}{a.personal ? ' ' : ''}{apptName(a)}
            {!horizontal && !small ? <Text style={st.blkSub}>  {apptSub(a)}</Text> : null}
          </Text>
          {horizontal ? <Text style={st.blkSub} numberOfLines={1}>{apptSub(a)}</Text> : null}
        </Pressable>
      </View>
    );
  };

  const hours: number[] = [];
  for (let h = Math.ceil(d.start / 60); h * 60 <= d.end; h++) hours.push(h);
  const nowIn = nowMin >= d.start && nowMin <= d.end;

  const weekStrip = (big?: boolean) => (
    <View style={st.week}>
      {d.week.map((w) => {
        const on = w.iso === today;
        return (
          <Pressable key={w.iso} onPress={() => onDay(w.iso)} accessibilityRole="button" accessibilityLabel={cap(t.days[dowIndex(w.iso)])}
            style={({ hovered }: any) => [st.wd, on && st.wdOn, !on && hovered && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={[st.wdName, on && { color: colors.primary }]}>{t.daysShort[dowIndex(w.iso)].slice(0, 2)}</Text>
            <Text style={[st.wdNum, big && { fontSize: 17 }, on && { color: colors.plum }]}>{dayNum(w.iso)}</Text>
            <View style={[st.wdDot, { opacity: w.any ? 1 : 0 }]} />
          </Pressable>
        );
      })}
    </View>
  );

  const sheet = <AppointmentSheet target={target} onClose={() => setTarget(null)} />;

  // ---------- calculator (pe lat) ----------
  if (wide) {
    const max = Math.max(1, ...d.week.map((w) => w.count));
    const nLanes = Math.max(1, ...Array.from(d.lanes.values()).map((l) => l.of));
    const tiles: { key: HomeGo | 'new'; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
      { key: 'new', icon: 'add', title: t.newAppt, sub: t.home.newSub },
      { key: 'program', icon: 'calendar-outline', title: t.home.calendar, sub: t.home.calSub },
      { key: 'list', icon: 'list-outline', title: t.tabs.list, sub: t.home.listSub },
      { key: 'reports', icon: 'stats-chart-outline', title: t.tabs.reports, sub: t.home.reportsSub },
    ];
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.wPage} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.wHero}>
            <View style={st.heroGlow} pointerEvents="none" />
            <Text style={st.wNum}>{dayNum(today)}</Text>
            <View style={{ flex: 1, minWidth: 260 }}>
              <Text style={st.wDate} numberOfLines={1}>{weekday}, {monthYear(today).toLowerCase()}</Text>
              <Text style={st.wGreet}>{greet}! {cap(summary)}{d.count ? ` · ${t.home.range(fromMin(d.firstStart), fromMin(d.lastEnd))}` : ''}</Text>
              <View style={st.stats}>
                <View style={st.stat}><Text style={st.statVal}>{d.count}</Text><Text style={st.statLbl}>{t.home.stats.appts}</Text></View>
                <View style={st.stat}><Text style={st.statVal}>{d.done}</Text><Text style={st.statLbl}>{t.home.stats.done}</Text></View>
                <View style={st.stat}><Text style={st.statVal}>{d.cancelled}</Text><Text style={st.statLbl}>{t.home.stats.cancelled}</Text></View>
                <View style={st.stat}><Text style={st.statVal}>{t.home.busy(d.busy).replace(/ ocupate$/, '')}</Text><Text style={st.statLbl}>{t.home.stats.busy}</Text></View>
              </View>
            </View>
            {nextCard(st.wNext)}
          </LinearGradient>

          <View style={st.card}>
            <View style={st.cardHead}>
              <Text style={st.cardTitle}>{t.home.dayTitle}</Text>
              <Text style={st.cardHint}>{dayHint}</Text>
            </View>
            {allDayBands}
            {d.timed.length ? (
              <View style={{ paddingTop: 14 }}>
                <View style={[st.hBand, { height: Math.min(3, nLanes) * 44 + 86 }]}>
                  {hours.map((h) => (
                    <View key={h} style={[st.hHour, { left: `${((h * 60 - d.start) / (d.end - d.start)) * 100}%` }]}>
                      {h * 60 < d.end ? <Text style={st.hHourText}>{String(h).padStart(2, '0')}:00</Text> : null}
                    </View>
                  ))}
                  <View style={st.hBlocks}>{d.timed.map((a) => block(a, true))}</View>
                  {nowIn ? (
                    <View style={[st.hNow, { left: `${((nowMin - d.start) / (d.end - d.start)) * 100}%` }]} pointerEvents="none">
                      <View style={st.hNowDot} />
                      <Text style={st.nowText}>{t.home.nowLbl} {fromMin(nowMin)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : <Text style={st.empty}>{t.home.dayEmpty}</Text>}
          </View>

          <View style={st.wBottom}>
            <View style={[st.card, { flex: 1, marginTop: 0 }]}>
              <Text style={st.cardTitle}>{t.home.weekTitle}</Text>
              <View style={st.wWeek}>
                {d.week.map((w) => {
                  const on = w.iso === today;
                  return (
                    <Pressable key={w.iso} onPress={() => onDay(w.iso)} accessibilityRole="button" style={({ hovered }: any) => [st.wk, on && { backgroundColor: colors.primarySoft }, !on && hovered && { backgroundColor: '#FBF6F7' }]}>
                      <Text style={st.wkName}>{t.daysShort[dowIndex(w.iso)].slice(0, 2)}</Text>
                      <Text style={[st.wkNum, on && { color: colors.primary }]}>{dayNum(w.iso)}</Text>
                      <View style={st.wkBar}>
                        {w.count ? <LinearGradient colors={on ? gradients.primary : gradients.gold} style={{ width: '100%', height: `${(w.count / max) * 100}%`, borderRadius: 99 }} /> : null}
                      </View>
                      <Text style={st.wkCount} numberOfLines={2}>{t.home.weekCount(w.count)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={st.wTiles}>
              {tiles.map((x) => {
                const isNew = x.key === 'new';
                const inner = (
                  <>
                    <View style={[st.tileIc, isNew && { backgroundColor: 'rgba(255,255,255,0.18)' }]}><Ionicons name={x.icon} size={22} color={isNew ? '#fff' : colors.primary} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[st.tileTitle, isNew && { color: '#fff' }]}>{x.title}</Text>
                      <Text style={[st.tileSub, isNew && { color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>{x.sub}</Text>
                    </View>
                  </>
                );
                return (
                  <Pressable key={x.key} onPress={() => (isNew ? openNew() : go(x.key as HomeGo))} accessibilityRole="button"
                    style={({ hovered, pressed }: any) => [st.tileWrap, hovered && { transform: [{ translateY: -2 }] }, pressed && { opacity: 0.9 }]}>
                    {isNew ? <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.tile, st.tileNew]}>{inner}</LinearGradient>
                      : <View style={st.tile}>{inner}</View>}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
        {sheet}
      </View>
    );
  }

  // ---------- telefon ----------
  const dock: { key: HomeGo | 'new'; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'program', icon: 'calendar-outline', label: t.home.calendar },
    { key: 'list', icon: 'list-outline', label: t.tabs.list },
    { key: 'new', icon: 'add', label: t.home.newShort },
    { key: 'reports', icon: 'stats-chart-outline', label: t.tabs.reports },
    { key: 'settings', icon: 'settings-outline', label: t.tabs.settings },
  ];
  const tlHeight = (d.end - d.start) * PX;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.pHero}>
          <View style={st.heroGlow} pointerEvents="none" />
          <View style={st.pBar}>
            <Image source={require('../../assets/logo-light.png')} style={st.logo} resizeMode="contain" accessibilityLabel={t.brand} />
            <Text style={st.monthPill}>{monthYear(today)}</Text>
          </View>
          <View style={st.pDate}>
            <Text style={st.pNum}>{dayNum(today)}</Text>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <Text style={st.pDay}>{weekday}</Text>
              <Text style={st.pSum} numberOfLines={1}>{cap(summary)}</Text>
            </View>
          </View>
          {weekStrip()}
        </LinearGradient>

        {nextCard(st.pNext)}

        <View style={[st.card, { marginHorizontal: 16 }]}>
          <View style={st.cardHead}>
            <Text style={st.cardTitle}>{t.home.dayTitle}</Text>
            <Text style={st.cardHint} numberOfLines={1}>{dayHint}</Text>
          </View>
          {d.allDay.length ? <View style={{ marginLeft: 46 }}>{allDayBands}</View> : null}
          {d.timed.length ? (
            <View style={{ height: tlHeight + 8, marginTop: 10 }}>
              {hours.map((h) => (
                <View key={h} style={[st.vHour, { top: (h * 60 - d.start) * PX }]}>
                  <Text style={st.vHourText}>{String(h).padStart(2, '0')}:00</Text>
                </View>
              ))}
              <View style={st.vBlocks}>{d.timed.map((a) => block(a, false))}</View>
              {nowIn ? (
                <View style={[st.vNow, { top: (nowMin - d.start) * PX }]} pointerEvents="none">
                  <View style={st.vNowDot} />
                  <Text style={[st.nowText, { right: 0, top: -10 }]}>{fromMin(nowMin)}</Text>
                </View>
              ) : null}
            </View>
          ) : <Text style={st.empty}>{t.home.dayEmpty}</Text>}
        </View>
      </ScrollView>

      <View style={[st.dockWrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
        <View style={st.dock}>
          {dock.map((x) => x.key === 'new' ? (
            <Pressable key={x.key} onPress={openNew} style={st.dockItem} accessibilityRole="button" accessibilityLabel={t.newAppt}>
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.dockAdd}>
                <Ionicons name="add" size={30} color="#fff" />
              </LinearGradient>
              <Text style={[st.dockText, { color: '#fff' }]}>{x.label}</Text>
            </Pressable>
          ) : (
            <Pressable key={x.key} onPress={() => go(x.key as HomeGo)} style={({ pressed }) => [st.dockItem, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={x.label}>
              <Ionicons name={x.icon} size={22} color="rgba(255,255,255,0.8)" />
              <Text style={st.dockText} numberOfLines={1}>{x.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {sheet}
    </View>
  );
}

/** pixeli pe minut în cronologia verticală (telefon) */
const PX = 1;

const st = StyleSheet.create({
  strike: { textDecorationLine: 'line-through', color: colors.muted },
  pill: { flexShrink: 0, fontSize: 10.5, ...font.w800, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, overflow: 'hidden' },
  heroGlow: { position: 'absolute', right: -70, top: -90, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(198,161,106,0.16)' },
  // următoarea programare
  next: { backgroundColor: colors.card, borderRadius: 24, padding: 18, paddingTop: 20, overflow: 'hidden', ...shadow, shadowOpacity: 0.16, shadowRadius: 26 },
  nextBar: { position: 'absolute', left: 0, right: 0, top: 0, height: 4 },
  nextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nextLbl: { fontSize: 11, ...font.w800, letterSpacing: 1.3, textTransform: 'uppercase', color: '#8E6A33' },
  nextIn: { fontSize: 12, ...font.w700, color: '#8E6A33', backgroundColor: colors.goldSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, overflow: 'hidden' },
  nextMain: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  av: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avText: { color: '#fff', fontSize: 17, ...font.w800 },
  nextName: { fontSize: 21, ...font.display, color: colors.ink },
  nextSub: { fontSize: 13, ...font.w500, color: colors.muted, marginTop: 2 },
  nextTime: { fontSize: 22, ...font.w800, color: colors.ink },
  nextUntil: { fontSize: 11.5, ...font.w600, color: colors.muted },
  // carduri
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#F2EAEC', ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 20, ...font.display, color: colors.ink },
  cardHint: { fontSize: 12, ...font.w700, color: colors.muted, flexShrink: 1 },
  empty: { fontSize: 14, ...font.w500, color: colors.muted, paddingVertical: 14 },
  allDay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6, gap: 8 },
  allDayText: { fontSize: 13, ...font.w700, flexShrink: 1 },
  // blocuri
  blkWrap: { position: 'absolute', padding: 2 },
  blk: { flex: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden', gap: 2 },
  blkCancelled: { backgroundColor: '#FBF3F4', borderLeftColor: '#E3B5B5', borderTopColor: '#E3B5B5' },
  blkNext: { ...shadow, shadowColor: '#7C5CD6', shadowOpacity: 0.2, shadowRadius: 12 },
  blkTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  blkTime: { fontSize: 11, ...font.w800 },
  blkName: { fontSize: 14, ...font.w800, color: colors.ink },
  blkSub: { fontSize: 12, ...font.w500, color: colors.muted },
  nowText: { position: 'absolute', fontSize: 10.5, ...font.w800, color: '#fff', backgroundColor: colors.primary, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden' },
  // telefon
  pHero: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 84, overflow: 'hidden' },
  pBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 110, height: 40 },
  monthPill: { color: '#fff', fontSize: 12, ...font.w700, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, overflow: 'hidden' },
  pDate: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 16 },
  pNum: { fontSize: 60, lineHeight: 62, ...font.display, color: '#fff' },
  pDay: { fontSize: 18, ...font.w800, color: '#fff' },
  pSum: { fontSize: 13, ...font.w500, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  week: { flexDirection: 'row', gap: 4, marginTop: 16 },
  wd: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 12 },
  wdOn: { backgroundColor: '#fff' },
  wdName: { fontSize: 11, ...font.w600, color: 'rgba(255,255,255,0.65)' },
  wdNum: { fontSize: 15, ...font.w800, color: '#fff', marginTop: 2 },
  wdDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginTop: 4 },
  pNext: { marginHorizontal: 16, marginTop: -64 },
  vHour: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.line, borderStyle: 'dashed' },
  vHourText: { position: 'absolute', left: 0, top: -8, fontSize: 11, ...font.w700, color: colors.muted, backgroundColor: colors.card, paddingRight: 6 },
  vBlocks: { position: 'absolute', left: 44, right: 0, top: 0, bottom: 0 },
  vNow: { position: 'absolute', left: 38, right: 0, borderTopWidth: 2, borderTopColor: colors.primary, zIndex: 3 },
  vNowDot: { position: 'absolute', left: -5, top: -6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  dockWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 14 },
  dock: { flexDirection: 'row', alignItems: 'flex-end', width: '100%', maxWidth: 440, backgroundColor: colors.plum, borderRadius: 26, paddingVertical: 10, paddingHorizontal: 6, ...shadow, shadowOpacity: 0.35, shadowRadius: 22 },
  dockItem: { flex: 1, alignItems: 'center', gap: 5 },
  dockText: { fontSize: 10.5, ...font.w700, color: 'rgba(255,255,255,0.75)' },
  dockAdd: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: -32, borderWidth: 4, borderColor: colors.bg },
  // calculator
  wPage: { padding: 28, paddingBottom: 40, maxWidth: 1500, width: '100%', alignSelf: 'center' },
  wHero: { borderRadius: 28, padding: 26, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', gap: 28, overflow: 'hidden', flexWrap: 'wrap' },
  wNum: { fontSize: 96, lineHeight: 100, ...font.display, color: '#fff' },
  wDate: { fontSize: 30, ...font.display, color: '#fff' },
  wGreet: { fontSize: 14, ...font.w500, color: 'rgba(255,255,255,0.78)', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  stat: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  statVal: { fontSize: 20, ...font.w800, color: '#fff' },
  statLbl: { fontSize: 12, ...font.w500, color: 'rgba(255,255,255,0.8)' },
  wNext: { width: 420, maxWidth: '100%' },
  hBand: { position: 'relative', marginBottom: 4 },
  hHour: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderLeftColor: colors.line, borderStyle: 'dashed' },
  hHourText: { position: 'absolute', bottom: 0, left: 4, fontSize: 11, ...font.w700, color: colors.muted },
  hBlocks: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 26 },
  hNow: { position: 'absolute', top: -10, bottom: 18, borderLeftWidth: 2, borderLeftColor: colors.primary, zIndex: 3 },
  hNowDot: { position: 'absolute', top: -4, left: -6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  wBottom: { flexDirection: 'row', gap: 20, marginTop: 20, alignItems: 'stretch' },
  wWeek: { flexDirection: 'row', gap: 8, marginTop: 14 },
  wk: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 2, borderRadius: 16 },
  wkName: { fontSize: 11, ...font.w700, color: colors.muted },
  wkNum: { fontSize: 17, ...font.w800, color: colors.ink },
  wkBar: { width: 10, height: 60, borderRadius: 99, backgroundColor: colors.line, justifyContent: 'flex-end', overflow: 'hidden', marginVertical: 4 },
  wkCount: { fontSize: 10.5, ...font.w600, color: colors.muted, textAlign: 'center' },
  wTiles: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignContent: 'stretch' },
  tileWrap: { width: '47%', flexGrow: 1, borderRadius: 22 },
  tile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 20, borderWidth: 1, borderColor: '#F2EAEC', ...shadow },
  tileNew: { borderWidth: 0, shadowColor: colors.primary, shadowOpacity: 0.3 },
  tileIc: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  tileTitle: { fontSize: 16, ...font.w800, color: colors.ink },
  tileSub: { fontSize: 12, ...font.w500, color: colors.muted, marginTop: 2 },
});
