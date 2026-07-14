import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider, useStore } from './src/store';
import { colors, font, space } from './src/theme';
import { FindScreen } from './src/screens/FindScreen';
import { NetworkScreen } from './src/screens/NetworkScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { PersonForm } from './src/screens/PersonForm';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { MeScreen } from './src/screens/MeScreen';

type Tab = 'find' | 'network' | 'people' | 'me';
type Overlay =
  | { kind: 'portfolio'; id: string }
  | { kind: 'form'; id?: string };

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'find', label: 'Find', icon: 'search' },
  { key: 'network', label: 'Network', icon: 'share-social' },
  { key: 'people', label: 'People', icon: 'people' },
  { key: 'me', label: 'Me', icon: 'person' },
];

function Shell() {
  const { loading } = useStore();
  const [tab, setTab] = useState<Tab>('find');
  // A simple navigation stack layered above the tabs (portfolio → edit, etc.).
  const [stack, setStack] = useState<Overlay[]>([]);

  const push = (o: Overlay) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const openPerson = (id: string) => push({ kind: 'portfolio', id });

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const top = stack[stack.length - 1];

  return (
    <View style={styles.root}>
      {/* Base tab content */}
      <View style={{ flex: 1 }}>
        {tab === 'find' && <FindScreen onOpenPerson={openPerson} />}
        {tab === 'network' && <NetworkScreen onOpenPerson={openPerson} />}
        {tab === 'people' && (
          <PeopleScreen onOpenPerson={openPerson} onAdd={() => push({ kind: 'form' })} />
        )}
        {tab === 'me' && <MeScreen />}
      </View>

      {/* Tab bar */}
      {!top && (
        <View style={styles.tabbar}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
                <Ionicons
                  name={active ? t.icon : (`${t.icon}-outline` as any)}
                  size={23}
                  color={active ? colors.accent : colors.textMuted}
                />
                <Text style={[styles.tabLabel, active && { color: colors.accent }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Overlay stack (portfolio / add / edit) */}
      {top && (
        <View style={styles.overlay}>
          {top.kind === 'portfolio' && (
            <PortfolioScreen
              personId={top.id}
              onBack={pop}
              onEdit={() => push({ kind: 'form', id: top.id })}
              onOpenPerson={openPerson}
            />
          )}
          {top.kind === 'form' && (
            <PersonForm
              personId={top.id}
              onCancel={pop}
              onDone={(id) => {
                // After adding a brand-new person, replace the form with their
                // portfolio; after editing, just go back.
                if (top.id) pop();
                else setStack((s) => [...s.slice(0, -1), { kind: 'portfolio', id }]);
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1, backgroundColor: colors.bg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: font.tiny, color: colors.textMuted, fontWeight: '500' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
});

// Web-only: remove the default browser focus outline on inputs so our own
// bordered fields read cleanly. No-op on native.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent =
    'input,textarea,select{outline:none!important}::placeholder{opacity:1}';
  document.head.appendChild(style);
}
