"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { appUrl } from "@/lib/app-url";
import {
  clearMockSession,
  isMockAuth,
  MOCK_OWNER,
  writeMockSession,
} from "@/lib/auth/mock-session";
import {
  loginPath,
  rememberNextPath,
  safeInternalPath,
} from "@/lib/auth/session";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NOT_CONFIGURED = "Sign-in is not configured on this deployment.";

/**
 * Where the provider sends the browser back. `?next=` rides along so the
 * intent that started the sign-in survives the round trip through Google or
 * the email client.
 */
async function callbackUrl(next: string) {
  const url = new URL("/auth/callback", await appUrl());
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}

async function signInWithGoogle(formData: FormData) {
  const next = safeInternalPath(formData.get("next")) ?? "/";

  if (isMockAuth()) {
    await writeMockSession(MOCK_OWNER);
    redirect(next);
  }
  if (!isSupabaseAuthConfigured()) {
    redirect(loginPath({ next, error: NOT_CONFIGURED }));
  }

  await rememberNextPath(next);
  const supabase = await createSupabaseServerClient();
  // PKCE: this writes the code verifier cookie that /auth/callback needs, which
  // is why the redirect has to be built server-side rather than linked to.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });

  if (error || !data.url) {
    redirect(loginPath({ next, error: error?.message ?? "Could not reach Google." }));
  }
  redirect(data.url);
}

async function sendMagicLink(formData: FormData) {
  const next = safeInternalPath(formData.get("next")) ?? "/";
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    redirect(loginPath({ next, error: "Enter a valid email." }));
  }
  const email = parsed.data;

  if (isMockAuth()) {
    await writeMockSession({ ...MOCK_OWNER, email });
    redirect(next);
  }
  if (!isSupabaseAuthConfigured()) {
    redirect(loginPath({ next, error: NOT_CONFIGURED }));
  }

  await rememberNextPath(next);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(next), shouldCreateUser: true },
  });

  if (error) {
    redirect(loginPath({ next, error: error.message }));
  }
  redirect(loginPath({ next, sent: email }));
}

async function signOut() {
  await clearMockSession();

  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    // Local scope: only this browser's tokens, not every device the user has.
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/");
}

export { sendMagicLink, signInWithGoogle, signOut };
