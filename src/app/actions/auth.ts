"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSession,
  createSession,
  MOCK_OWNER,
  safeInternalPath,
} from "@/lib/auth/session";

async function sendMagicLink(formData: FormData) {
  const next = safeInternalPath(formData.get("next")) ?? "/";
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    const params = new URLSearchParams({ error: "Enter a valid email." });
    if (next !== "/") params.set("next", next);
    redirect(`/login?${params.toString()}`);
  }

  await createSession({ ...MOCK_OWNER, email: parsed.data });
  redirect(next);
}

async function signOut() {
  await clearSession();
  redirect("/");
}

export { sendMagicLink, signOut };
