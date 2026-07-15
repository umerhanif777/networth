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

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfig = { url, anonKey };

/** True only when a backend is configured; gates every sync/social surface. */
export function isSyncConfigured(): boolean {
  return Boolean(url && anonKey);
}
