import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProgramScreen } from './src/screens/ProgramScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme';
import { t } from './src/i18n';

type Tab = 'program' | 'reports' | 'settings';
const TABS: { key: Tab; icon: keyof typeof Ionicons.glyphMap; iconOn: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'program', icon: 'calendar-outline', iconOn: 'calendar' },
  { key: 'reports', icon: 'stats-chart-outline', iconOn: 'stats-chart' },
  { key: 'settings', icon: 'settings-outline', iconOn: 'settings' },
];

function Shell() {
  const { loaded } = useApp();
  const [tab, setTab] = useState<Tab>('program');
  const insets = useSafeAreaInsets();
  if (!loaded) {
    return <View style={st.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={st.loading}>{t.loading}</Text></View>;
  }
  return (
    <View style={st.root}>
      <View style={st.page}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={{ flex: 1, display: tab === 'program' ? 'flex' : 'none' }}><ProgramScreen /></View>
          {tab === 'reports' ? <ReportsScreen goSettings={() => setTab('settings')} /> : null}
          {tab === 'settings' ? <SettingsScreen /> : null}
        </SafeAreaView>
        <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((x) => {
            const on = tab === x.key;
            return (
              <Pressable key={x.key} style={st.tab} onPress={() => setTab(x.key)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                <View style={[st.pill, on && { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={on ? x.iconOn : x.icon} size={24} color={on ? colors.primary : colors.muted} />
                </View>
                <Text style={[st.tabText, on && { color: colors.primary }]}>{t.tabs[x.key]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  page: { flex: 1, width: '100%', maxWidth: 900, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loading: { marginTop: 12, color: colors.muted, fontSize: 16 },
  bar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff', paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center' },
  pill: { paddingHorizontal: 20, paddingVertical: 4, borderRadius: 16 },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 2 },
});
