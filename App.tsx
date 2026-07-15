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
import { AccountProvider } from './src/account';
import { colors, font, space } from './src/theme';
import { Logo } from './src/components/Logo';
import { FindScreen } from './src/screens/FindScreen';
import { NetworkScreen } from './src/screens/NetworkScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { PersonForm } from './src/screens/PersonForm';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { MeScreen } from './src/screens/MeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

type Tab = 'find' | 'network' | 'people' | 'me';
type Overlay =
  | { kind: 'portfolio'; id: string }
  | { kind: 'form'; id?: string }
  | { kind: 'onboarding' };

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
      {/* Brand header — shown on every tab (overlays cover it with their own bar) */}
      <View style={styles.brandBar}>
        <Logo size={28} />
        <Text style={styles.brandName}>Networthit</Text>
      </View>

      {/* Base tab content */}
      <View style={{ flex: 1 }}>
        {tab === 'find' && <FindScreen onOpenPerson={openPerson} />}
        {tab === 'network' && <NetworkScreen onOpenPerson={openPerson} />}
        {tab === 'people' && (
          <PeopleScreen onOpenPerson={openPerson} onAdd={() => push({ kind: 'form' })} />
        )}
        {tab === 'me' && (
          <MeScreen onBackupSync={() => push({ kind: 'onboarding' })} />
        )}
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
          {top.kind === 'onboarding' && <OnboardingScreen onClose={pop} />}
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
        <AccountProvider>
          <Shell />
        </AccountProvider>
      </StoreProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1, backgroundColor: colors.bg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  brandName: {
    fontSize: font.h2,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
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

// Web-only bootstrap: focus-outline reset + PWA wiring (manifest, theme/apple
// meta, service worker). Runs once at module load; no-op on native. Injecting
// the manifest/meta at runtime keeps the non-Expo-Router HTML template untouched
// while still making the app installable and offline-capable.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent =
    'input,textarea,select{outline:none!important}::placeholder{opacity:1}';
  document.head.appendChild(style);

  const head = document.head;
  const ensure = (selector: string, make: () => HTMLElement) => {
    if (!head.querySelector(selector)) head.appendChild(make());
  };
  const meta = (name: string, content: string) => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', content);
    return m;
  };
  const link = (rel: string, href: string) => {
    const l = document.createElement('link');
    l.setAttribute('rel', rel);
    l.setAttribute('href', href);
    return l;
  };

  ensure('link[rel="manifest"]', () => link('manifest', '/manifest.json'));
  ensure('meta[name="theme-color"]', () => meta('theme-color', '#F6F5F1'));
  ensure('meta[name="mobile-web-app-capable"]', () => meta('mobile-web-app-capable', 'yes'));
  ensure('meta[name="apple-mobile-web-app-capable"]', () =>
    meta('apple-mobile-web-app-capable', 'yes')
  );
  ensure('meta[name="apple-mobile-web-app-status-bar-style"]', () =>
    meta('apple-mobile-web-app-status-bar-style', 'default')
  );
  ensure('meta[name="apple-mobile-web-app-title"]', () =>
    meta('apple-mobile-web-app-title', 'Networthit')
  );
  ensure('link[rel="apple-touch-icon"]', () => link('apple-touch-icon', '/icons/icon-192.png'));

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((e) => console.warn('Networth: service worker registration failed', e));
    });
  }
}
