import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseAuthEnv } from "@/lib/supabase/env";

/**
 * A new client per request, never cached, because it closes over this request's
 * cookie store.
 *
 * `setAll` fails inside a Server Component render, where cookies are read-only.
 * Swallowing that is deliberate: reads still work, and `proxy.ts` is the one
 * place that persists a refreshed token.
 */
async function createSupabaseServerClient() {
  const env = supabaseAuthEnv();
  if (!env) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.local and fill in the Supabase keys."
    );
  }

  const store = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Component render; the proxy refreshes instead.
        }
      },
    },
  });
}

export { createSupabaseServerClient };
