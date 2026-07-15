import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSyncConfigured, supabaseConfig } from './config';

// A single Supabase client, created only when a backend is configured. Sessions
// persist in AsyncStorage (localStorage on web); on web we also let the client
// pick the session out of the magic-link / OAuth redirect URL.
export const supabase: SupabaseClient | null = isSyncConfigured()
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        storage: AsyncStorage as any,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;
