type SupabaseAuthEnv = {
  url: string;
  anonKey: string;
};

/**
 * Both values are public keys, so their presence is the honest signal for
 * "auth is wired up". Returns null rather than throwing, because callers
 * differ: a page read tolerates a missing session, a sign-in has to explain
 * itself.
 */
function supabaseAuthEnv(): SupabaseAuthEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function isSupabaseAuthConfigured() {
  return supabaseAuthEnv() !== null;
}

export { isSupabaseAuthConfigured, supabaseAuthEnv, type SupabaseAuthEnv };
