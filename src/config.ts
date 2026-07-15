// Supabase sync configuration.
//
// Values come from EXPO_PUBLIC_* env vars, which Expo inlines into the client
// bundle at build time. They are public by design — the anon key is meant to
// live in the client, and row-level security (defined server-side) is what
// actually protects each user's data.
//
// When either value is missing, sync and social stay switched OFF and the app
// runs as a purely local, offline app (today's behaviour). Set these in a local
// `.env` for dev and in the Cloudflare Pages project settings for the deploy.

// Env vars win when set (local .env or Cloudflare dashboard); otherwise fall
// back to the committed public values so every build — including Cloudflare
// Pages, which doesn't auto-load .env — has them. These are public by design;
// row-level security is what protects the data.
const FALLBACK_URL = 'https://qhopempqsfnnsnslqyuq.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob3BlbXBxc2ZubnNuc2xxeXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTAwOTcsImV4cCI6MjA5OTY4NjA5N30.OxTQUysHM7kVW4CMF3hACRz1JYJNsNOMDU2_bpd_Rgo';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const supabaseConfig = { url, anonKey };

/** True only when a backend is configured; gates every sync/social surface. */
export function isSyncConfigured(): boolean {
  return Boolean(url && anonKey);
}
