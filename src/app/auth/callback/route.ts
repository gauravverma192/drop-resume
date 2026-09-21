import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { isMockAuth, MOCK_OWNER, writeMockSession } from "@/lib/auth/mock-session";
import { loginPath, safeInternalPath, takeNextPath } from "@/lib/auth/session";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LINK_SPENT =
  "That sign-in link has expired or was already used. Request a new one.";
const LINK_INCOMPLETE = "That sign-in link is incomplete. Request a new one.";
const NOT_CONFIGURED = "Sign-in is not configured on this deployment.";

/** A response that sets auth cookies must never be cached by a CDN. */
function redirectTo(path: string, request: Request) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/**
 * Both providers land here. Google and PKCE email links arrive with `?code=`;
 * email templates written against `{{ .TokenHash }}` arrive with
 * `?token_hash=&type=`. Either way the exchange happens server-side, so the
 * session lands in cookies rather than in a URL fragment the server never sees.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Magic-link templates cannot always carry the query string, hence the cookie.
  const next =
    safeInternalPath(url.searchParams.get("next")) ?? (await takeNextPath()) ?? "/";

  const settle = ({ error }: { error: unknown }) =>
    error
      ? redirectTo(loginPath({ next, error: LINK_SPENT }), request)
      : redirectTo(next, request);

  const denied =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (denied) {
    return redirectTo(loginPath({ next, error: denied }), request);
  }

  if (isMockAuth()) {
    await writeMockSession(MOCK_OWNER);
    return redirectTo(next, request);
  }
  if (!isSupabaseAuthConfigured()) {
    return redirectTo(loginPath({ next, error: NOT_CONFIGURED }), request);
  }

  const supabase = await createSupabaseServerClient();

  const code = url.searchParams.get("code");
  if (code) {
    return settle(await supabase.auth.exchangeCodeForSession(code));
  }

  const tokenHash = url.searchParams.get("token_hash");
  if (tokenHash) {
    const type = (url.searchParams.get("type") as EmailOtpType | null) ?? "email";
    return settle(await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  }

  return redirectTo(loginPath({ next, error: LINK_INCOMPLETE }), request);
}
