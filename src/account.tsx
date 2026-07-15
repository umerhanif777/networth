import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { isSyncConfigured } from './config';
import { supabase } from './supabase';
import { useStore } from './store';
import { mergeLocalRemote, personToRow, type PersonRow } from './personRow';
import type { Person } from './types';

// Account + offline-first sync. Local storage stays the source of truth; when
// signed in we merge with the backend (last-write-wins on updatedAt), push local
// changes as they happen, and tombstone deletes. Everything degrades to the
// plain local app when there's no backend or no connection.

export type AuthStatus = 'signed-out' | 'signed-in';
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface AccountUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Account {
  configured: boolean;
  status: AuthStatus;
  user: AccountUser | null;
  syncStatus: SyncStatus;
  signInWithGoogle: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  sendPhoneCode: (phone: string) => Promise<void>;
  verifyPhoneCode: (phone: string, code: string) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const AccountContext = createContext<Account | null>(null);

const redirectUrl = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;

const userFromSession = (s: Session | null): AccountUser | null => {
  if (!s?.user) return null;
  const m = s.user.user_metadata ?? {};
  return {
    id: s.user.id,
    email: s.user.email ?? undefined,
    phone: s.user.phone ?? undefined,
    name: m.name ?? m.full_name ?? undefined,
  };
};

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const configured = isSyncConfigured();
  const store = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const user = useMemo(() => userFromSession(session), [session]);
  const status: AuthStatus = user ? 'signed-in' : 'signed-out';

  // Refs so async sync always sees the latest people without stale closures.
  const peopleRef = useRef<Person[]>(store.people);
  peopleRef.current = store.people;
  const lastSynced = useRef<Map<string, number>>(new Map());
  const initialized = useRef(false);
  const syncing = useRef(false);

  // Track auth session.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const stampOf = (p: Person) => p.updatedAt ?? p.createdAt ?? 0;

  const fullSync = async () => {
    if (!supabase || !user) return;
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      const { data, error } = await supabase.from('people').select('*').eq('owner', user.id);
      if (error) throw error;
      const remote = (data ?? []) as PersonRow[];
      const merged = mergeLocalRemote(peopleRef.current, remote);
      store.setAll(merged);
      peopleRef.current = merged;
      // Push the merged set up so the backend has everything (idempotent upsert).
      const rows = merged.map((p) => personToRow(p, user.id));
      if (rows.length) {
        const { error: upErr } = await supabase.from('people').upsert(rows);
        if (upErr) throw upErr;
      }
      lastSynced.current = new Map(merged.map((p) => [p.id, stampOf(p)]));
      initialized.current = true;
      setSyncStatus('idle');
    } catch (e) {
      setSyncStatus('error');
    } finally {
      syncing.current = false;
    }
  };

  // Run the initial sync when a user signs in; reset when they sign out.
  useEffect(() => {
    if (!configured || !supabase) return;
    if (user) {
      fullSync();
    } else {
      initialized.current = false;
      lastSynced.current = new Map();
      setSyncStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, configured]);

  // Push local changes (adds/edits/deletes) to the backend as they happen.
  useEffect(() => {
    if (!supabase || !user || !initialized.current || syncing.current) return;
    const people = store.people;
    const changed: Person[] = [];
    const currentIds = new Set<string>();
    for (const p of people) {
      currentIds.add(p.id);
      if (lastSynced.current.get(p.id) !== stampOf(p)) changed.push(p);
    }
    const deletedIds = [...lastSynced.current.keys()].filter((id) => !currentIds.has(id));
    if (!changed.length && !deletedIds.length) return;

    (async () => {
      try {
        if (changed.length) {
          const { error } = await supabase.from('people').upsert(changed.map((p) => personToRow(p, user.id)));
          if (error) throw error;
        }
        for (const id of deletedIds) {
          await supabase
            .from('people')
            .update({ deleted: true, updated_at: Date.now() })
            .match({ owner: user.id, id });
        }
        lastSynced.current = new Map(people.map((p) => [p.id, stampOf(p)]));
        setSyncStatus('idle');
      } catch (e) {
        setSyncStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.people, user?.id]);

  const api = useMemo<Account>(
    () => ({
      configured,
      status,
      user,
      syncStatus,
      signInWithGoogle: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl() },
        });
        if (error) throw error;
      },
      sendEmailLink: async (email: string) => {
        if (!supabase) throw new Error('Sync is not configured.');
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectUrl() },
        });
        if (error) throw error;
      },
      sendPhoneCode: async (phone: string) => {
        if (!supabase) throw new Error('Sync is not configured.');
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
      },
      verifyPhoneCode: async (phone: string, code: string) => {
        if (!supabase) throw new Error('Sync is not configured.');
        const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
        if (error) throw error;
      },
      setDisplayName: async (name: string) => {
        if (!supabase) return;
        const { error } = await supabase.auth.updateUser({ data: { name } });
        if (error) throw error;
      },
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
      syncNow: fullSync,
    }),
    [configured, status, user, syncStatus]
  );

  return <AccountContext.Provider value={api}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
}
