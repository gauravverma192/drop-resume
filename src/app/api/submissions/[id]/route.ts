import { NextResponse } from "next/server";

import { updateSubmissionSchema } from "@/lib/contracts/submissions";
import { validationError } from "@/lib/contracts/errors";
import { updateSubmissionStatus } from "@/lib/data";
import { caughtErrorResponse, jsonError, requireApiUser } from "@/lib/http/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(validationError(parsed.error));
    }
    const submission = await updateSubmissionStatus(user.id, id, parsed.data.status);
    return NextResponse.json(submission);
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
