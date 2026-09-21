import { cookies } from "next/headers";
import { z } from "zod";

import type { SessionUser } from "@/lib/data/types";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

const MOCK_SESSION_COOKIE = "dr_mock_session";

/** Owner of the seeded in-memory roles, so the mock dashboard is not empty. */
const MOCK_OWNER: SessionUser = {
  id: "user_gaurav",
  email: "gaurav@agoda.com",
  name: "Gaurav Verma",
};

const mockSessionSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
});

/**
 * Sign-in mints a plain cookie holding {@link MOCK_OWNER} when the Supabase keys
 * are absent, so `npm run dev` works before any account exists. Never in
 * production: a missing key there has to fail closed rather than hand out a
 * session to anyone who asks.
 */
function isMockAuth() {
  return process.env.NODE_ENV !== "production" && !isSupabaseAuthConfigured();
}

async function readMockSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(MOCK_SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    return mockSessionSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeMockSession(user: SessionUser) {
  const store = await cookies();
  store.set(MOCK_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

async function clearMockSession() {
  const store = await cookies();
  store.delete(MOCK_SESSION_COOKIE);
}

export {
  clearMockSession,
  isMockAuth,
  MOCK_OWNER,
  MOCK_SESSION_COOKIE,
  readMockSession,
  writeMockSession,
};
