import { NextResponse } from "next/server";

import {
  createSession,
  MOCK_OWNER,
  safeInternalPath,
} from "@/lib/auth/session";

export async function GET(request: Request) {
  const next =
    safeInternalPath(new URL(request.url).searchParams.get("next")) ?? "/";
  await createSession(MOCK_OWNER);
  return NextResponse.redirect(new URL(next, request.url));
}
