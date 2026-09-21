import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { createRoleSchema } from "@/lib/contracts/roles";
import { validationError } from "@/lib/contracts/errors";
import { createRole } from "@/lib/data";
import { caughtErrorResponse, jsonError } from "@/lib/http/api";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body: unknown = await request.json();
    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(validationError(parsed.error));
    }
    const role = await createRole(user.id, parsed.data);
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
