import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { SessionUser } from "@/lib/data/types";

const SESSION_COOKIE = "dr_session";

const sessionSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
});

/** Seeded owner; Google and magic link both mint this id so the demo roles stay visible. */
const MOCK_OWNER: SessionUser = {
  id: "user_gaurav",
  email: "gaurav@agoda.com",
  name: "Gaurav Verma",
};

/** Only same-origin paths survive `?next=` — protocol-relative and open redirects do not. */
function safeInternalPath(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return sessionSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function createSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

async function requirePageUser(nextPath: string): Promise<SessionUser> {
  const user = await getSession();
  if (user) return user;

  const next = safeInternalPath(nextPath) ?? "/";
  redirect(`/login?next=${encodeURIComponent(next)}`);
}

export {
  clearSession,
  createSession,
  getSession,
  MOCK_OWNER,
  requirePageUser,
  safeInternalPath,
  SESSION_COOKIE,
};
