import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProgramScreen } from './src/screens/ProgramScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors, font, gradients, shadow } from './src/theme';
import { t } from './src/i18n';
import { useWide } from './src/components/ui';
import { todayISO } from './src/utils/date';
import { applyAppIcon, logoImages, logoVariant } from './src/services/appIcon';

type Tab = 'home' | 'program' | 'list' | 'reports' | 'settings';
const TABS: { key: Tab; icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', icon: 'home-outline', iconOn: 'home' },
  { key: 'program', icon: 'calendar-outline', iconOn: 'calendar' },
  { key: 'list', icon: 'list-outline', iconOn: 'list' },
  { key: 'reports', icon: 'stats-chart-outline', iconOn: 'stats-chart' },
  { key: 'settings', icon: 'settings-outline', iconOn: 'settings' },
];

/** Bara laterală (doar pe ecrane late / browser pe calculator) */
function Sidebar({ tab, setTab, onNew }: { tab: Tab; setTab: (t: Tab) => void; onNew: () => void }) {
  const { appointments, syncConnected, syncStatus } = useApp();
  const today = todayISO();
  const todayCount = appointments.filter((a) => a.date === today && a.status !== 'anulat' && !a.personal).length;
  return (
    <LinearGradient colors={gradients.sidebar} style={st.side}>
      <View style={st.brand}>
        <View style={st.brandMark}><Text style={st.brandMarkText}>A.M.</Text></View>
        <View>
          <Text style={st.brandName}>{t.brand}</Text>
          <Text style={st.brandSub}>{t.brandSub}</Text>
        </View>
      </View>

      <Pressable onPress={onNew} style={({ pressed }) => [st.newBtn, pressed && { opacity: 0.9 }]} accessibilityRole="button">
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.newBtnIn}>
          <Ionicons name="add" size={22} color={colors.plum} />
          <Text style={st.newBtnText}>{t.newAppt}</Text>
        </LinearGradient>
      </Pressable>

      <View style={{ marginTop: 18 }}>
        {TABS.map((x) => {
          const on = tab === x.key;
          return (
            <Pressable key={x.key} onPress={() => setTab(x.key)} accessibilityLabel={t.tabs[x.key]} style={({ hovered }: any) => [st.navItem, on && st.navOn, !on && hovered && st.navHover]}
              accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Ionicons name={on ? x.iconOn : x.icon} size={20} color={on ? '#fff' : 'rgba(255,255,255,0.6)'} />
              <Text style={[st.navText, on && { color: '#fff' }]}>{t.tabs[x.key]}</Text>
              {x.key === 'program' && todayCount > 0 ? <View style={st.navBadge}><Text style={st.navBadgeText}>{todayCount}</Text></View> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <View style={st.sideFoot}>
        <Ionicons name={syncConnected ? (syncStatus === 'error' ? 'cloud-offline-outline' : 'cloud-done-outline') : 'phone-portrait-outline'} size={16} color={colors.gold} />
        <Text style={st.sideFootText}>{syncConnected ? (syncStatus === 'error' ? t.sync.status.error : t.sync.status.ok) : t.localOnly}</Text>
      </View>
    </LinearGradient>
  );
}

function Shell() {
  const { loaded, settings } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [newSignal, setNewSignal] = useState(0);
  const [focus, setFocus] = useState<{ date: string; n: number } | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const wide = useWide();
  const variant = logoVariant(settings.logoBg, settings.logoShape);
  useEffect(() => { if (loaded) applyAppIcon(variant); }, [loaded, variant]);
  if (!loaded) {
    return <View style={st.center}><Image source={logoImages['alb-patrat']} style={{ width: 240, height: 240 }} resizeMode="contain" /><ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} /><Text style={st.loading}>{t.loading}</Text></View>;
  }
  const screens = (
    <>
      {tab === 'home' ? <HomeScreen go={setTab} onDay={(date) => { setFocus((f) => ({ date, n: (f?.n || 0) + 1 })); setTab('program'); }} /> : null}
      <View style={{ flex: 1, display: tab === 'program' ? 'flex' : 'none' }}><ProgramScreen newSignal={newSignal} focus={focus} /></View>
      {tab === 'list' ? <ListScreen /> : null}
      {tab === 'reports' ? <ReportsScreen goSettings={() => setTab('settings')} /> : null}
      {tab === 'settings' ? <SettingsScreen /> : null}
    </>
  );

  if (wide) {
    return (
      <View style={[st.root, { flexDirection: 'row' }]}>
        <Sidebar tab={tab} setTab={setTab} onNew={() => { setTab('program'); setNewSignal((n) => n + 1); }} />
        <View style={{ flex: 1 }}>{screens}</View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <View style={st.page}>
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.plum }}>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>{screens}</View>
        </SafeAreaView>
        {tab !== 'home' ? <View style={[st.barWrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
          <View style={st.bar}>
            {TABS.map((x) => {
              const on = tab === x.key;
              return (
                <Pressable key={x.key} style={[st.tab, { flex: on ? 2.6 : 1 }]} onPress={() => setTab(x.key)} accessibilityRole="tab" accessibilityLabel={t.tabs[x.key]} accessibilityState={{ selected: on }}>
                  {on ? (
                    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.pill}>
                      <Ionicons name={x.iconOn} size={20} color="#fff" />
                      <Text style={st.tabTextOn}>{t.tabs[x.key]}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={st.pill}><Ionicons name={x.icon} size={22} color={colors.muted} /></View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View> : null}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, PlayfairDisplay_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {fontsLoaded ? (
        <AppProvider>
          <Shell />
        </AppProvider>
      ) : (
        <View style={st.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      )}
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  page: { flex: 1, width: '100%', backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loading: { marginTop: 12, color: colors.muted, fontSize: 16 },
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 999, padding: 6, width: '100%', maxWidth: 420,
    borderWidth: 1, borderColor: '#F0E6EA', ...shadow, shadowOpacity: 0.16, shadowRadius: 24,
  },
  tab: { flex: 1, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 46, paddingHorizontal: 12, borderRadius: 999, gap: 6 },
  tabTextOn: { fontSize: 14, ...font.w700, color: '#fff' },
  side: { width: 260, paddingHorizontal: 18, paddingVertical: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 },
  brandMark: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.gold, fontSize: 14, ...font.display },
  brandName: { color: '#fff', fontSize: 20, ...font.display },
  brandSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, ...font.w600, letterSpacing: 1.2, textTransform: 'uppercase' },
  newBtn: { marginTop: 28, borderRadius: 999 },
  newBtnIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 999, gap: 6 },
  newBtnText: { color: colors.plum, fontSize: 15, ...font.w800 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, height: 46, borderRadius: 14, marginTop: 4 },
  navOn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  navHover: { backgroundColor: 'rgba(255,255,255,0.05)' },
  navText: { color: 'rgba(255,255,255,0.65)', fontSize: 15, ...font.w700, flex: 1 },
  navBadge: { backgroundColor: colors.primary, borderRadius: 10, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  navBadgeText: { color: '#fff', fontSize: 12, ...font.w800 },
  sideFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  sideFootText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, ...font.w600 },
});
