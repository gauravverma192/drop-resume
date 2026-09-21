import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { supabaseAuthEnv } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase session and nothing else.
 *
 * An access token lives an hour. When it expires, whichever call site reads the
 * user gets a fresh pair of tokens back - and a Server Component cannot write
 * them to cookies, so without this the browser would keep replaying a spent
 * refresh token until Supabase stops honouring it and the user is silently
 * signed out. Authorization stays in `requireUser()`, close to the data, per the
 * Next.js guidance that a proxy is at best an optimistic check.
 */
export async function proxy(request: NextRequest) {
  const env = supabaseAuthEnv();
  if (!env) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // Rebuilt so this render sees the new tokens too, not just the browser.
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skips static assets and the public candidate paths, which never read a session.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|j/|api/public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
