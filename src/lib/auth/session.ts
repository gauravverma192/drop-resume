import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isMockAuth, readMockSession } from "@/lib/auth/mock-session";
import { DataError } from "@/lib/data/errors";
import type { SessionUser } from "@/lib/data/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only same-origin paths survive `?next=` — protocol-relative and open redirects do not. */
function safeInternalPath(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

/** Builds the one URL every failed or pending sign-in bounces back to. */
function loginPath({
  next,
  error,
  sent,
}: { next?: string; error?: string; sent?: string } = {}) {
  const params = new URLSearchParams();
  const safeNext = safeInternalPath(next);
  if (safeNext && safeNext !== "/") params.set("next", safeNext);
  if (error) params.set("error", error);
  if (sent) params.set("sent", sent);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

const NEXT_COOKIE = "dr_auth_next";

/**
 * Parks the post-sign-in destination for the callback to pick up. The query
 * string carries it for OAuth, but a magic link is built from a Supabase email
 * template we do not control, so the cookie is the path that always survives.
 */
async function rememberNextPath(next: string) {
  const store = await cookies();
  if (next === "/") {
    store.delete(NEXT_COOKIE);
    return;
  }
  store.set(NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Reads and clears it: one sign-in, one redirect. */
async function takeNextPath() {
  const store = await cookies();
  const parked = safeInternalPath(store.get(NEXT_COOKIE)?.value);
  store.delete(NEXT_COOKIE);
  return parked;
}

/** Google fills these in; a magic-link user arrives with no profile at all. */
function displayName(user: User) {
  for (const key of ["full_name", "name"] as const) {
    const value = user.user_metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return user.email?.split("@")[0] ?? "Recruiter";
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email ?? "",
    name: displayName(user),
  };
}

/**
 * The verified user for this request, or null.
 *
 * `getUser()` costs a round trip to Supabase Auth because it validates the
 * access token there rather than trusting the cookie, so the result is memoised
 * for the request - a page that renders the header and reads roles pays once.
 */
const getSession = cache(async (): Promise<SessionUser | null> => {
  if (isMockAuth()) return readMockSession();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return toSessionUser(data.user);
});

/**
 * The single authorization gate: every recruiter query takes the id this
 * returns, since Prisma connects as the owner role and bypasses Supabase RLS.
 * Throws so API routes answer 401 through the shared error envelope.
 */
async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new DataError("UNAUTHENTICATED");
  return user;
}

/** Same gate for pages, which send the visitor to sign in and come back. */
async function requirePageUser(nextPath: string): Promise<SessionUser> {
  const user = await getSession();
  if (user) return user;
  redirect(loginPath({ next: nextPath }));
}

export {
  getSession,
  loginPath,
  rememberNextPath,
  requirePageUser,
  requireUser,
  safeInternalPath,
  takeNextPath,
};
