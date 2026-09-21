import { NextResponse } from "next/server";

import { bulkUpdateSubmissionsSchema } from "@/lib/contracts/submissions";
import { validationError } from "@/lib/contracts/errors";
import { bulkUpdateSubmissionStatus } from "@/lib/data";
import { caughtErrorResponse, jsonError, requireApiUser } from "@/lib/http/api";

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const body: unknown = await request.json();
    const parsed = bulkUpdateSubmissionsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(validationError(parsed.error));
    }
    const result = await bulkUpdateSubmissionStatus(
      user.id,
      parsed.data.ids,
      parsed.data.status
    );
    return NextResponse.json(result);
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
