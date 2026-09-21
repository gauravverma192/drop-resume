import { NextResponse } from "next/server";

import { updateRoleSchema } from "@/lib/contracts/roles";
import { validationError } from "@/lib/contracts/errors";
import { deleteRole, updateRole } from "@/lib/data";
import { caughtErrorResponse, jsonError, requireApiUser } from "@/lib/http/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(validationError(parsed.error));
    }
    const role = await updateRole(user.id, id, parsed.data);
    return NextResponse.json(role);
  } catch (error) {
    return caughtErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await deleteRole(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
