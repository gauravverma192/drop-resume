import { NextResponse } from "next/server";

import { reparseSubmission } from "@/lib/data";
import { caughtErrorResponse, requireApiUser } from "@/lib/http/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const submission = await reparseSubmission(user.id, id);
    return NextResponse.json(submission);
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
