import React, { createContext, useContext, useMemo, useState } from 'react';
import { isSyncConfigured } from './config';

// Account + sync state for Phase 2A. This is the seam the real Supabase client
// slots into: the interface is final, the implementations are placeholders that
// resolve as no-ops until a backend is configured (isSyncConfigured() === false),
// at which point every sync/social surface stays hidden. When the Supabase URL +
// anon key are set, we swap these bodies for real auth/sync calls without
// touching any screen.

export type AuthStatus = 'signed-out' | 'signed-in';
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface AccountUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Account {
  /** Whether a backend exists at all — gates all sync/social UI. */
  configured: boolean;
  status: AuthStatus;
  user: AccountUser | null;
  syncStatus: SyncStatus;

  // Sign-in flows (all three offered to the user).
  signInWithGoogle: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  sendPhoneCode: (phone: string) => Promise<void>;
  verifyPhoneCode: (phone: string, code: string) => Promise<void>;

  setDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Push/pull local data against the backend (offline-first, safe to call). */
  syncNow: () => Promise<void>;
}

const notWired = async () => {
  // Placeholder — real Supabase calls land here once the backend is configured.
  return;
};

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const configured = isSyncConfigured();
  const [status, setStatus] = useState<AuthStatus>('signed-out');
  const [user, setUser] = useState<AccountUser | null>(null);
  const [syncStatus] = useState<SyncStatus>('idle');

  const api = useMemo<Account>(
    () => ({
      configured,
      status,
      user,
      syncStatus,
      signInWithGoogle: notWired,
      sendEmailLink: notWired,
      sendPhoneCode: notWired,
      verifyPhoneCode: notWired,
      setDisplayName: async (name: string) => setUser((u) => (u ? { ...u, name } : u)),
      signOut: async () => {
        setStatus('signed-out');
        setUser(null);
      },
      syncNow: notWired,
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
