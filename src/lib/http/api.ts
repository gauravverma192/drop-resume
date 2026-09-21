import { NextResponse } from "next/server";

import type { ErrorCode, ErrorEnvelope } from "@/lib/contracts/errors";
import { DataError, isDataError } from "@/lib/data/errors";

const statusByCode: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  ROLE_CLOSED: 409,
  DUPLICATE_EMAIL: 409,
  FILE_TOO_LARGE: 400,
  FILE_TYPE_REJECTED: 400,
  RATE_LIMITED: 429,
  TURNSTILE_FAILED: 400,
};

function jsonError(error: DataError | ErrorEnvelope, status?: number) {
  const envelope = error instanceof DataError ? error.toEnvelope() : error;
  return NextResponse.json(envelope, {
    status: status ?? statusByCode[envelope.error.code],
  });
}

function caughtErrorResponse(error: unknown) {
  if (isDataError(error)) return jsonError(error);
  throw error;
}

export { caughtErrorResponse, jsonError, statusByCode };
