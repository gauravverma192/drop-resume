import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { reparseSubmission } from "@/lib/data";
import { caughtErrorResponse } from "@/lib/http/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const submission = await reparseSubmission(user.id, id);
    return NextResponse.json(submission);
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
