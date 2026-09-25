import { z } from "zod";

/** Codes in `{ error: { code, message } }`. Shared by every route handler. */
const errorCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "ROLE_CLOSED",
  "DUPLICATE_EMAIL",
  "FILE_TOO_LARGE",
  "FILE_TYPE_REJECTED",
  "RATE_LIMITED",
  "TURNSTILE_FAILED",
] as const;

const errorCodeSchema = z.enum(errorCodes);

type ErrorCode = z.infer<typeof errorCodeSchema>;

const errorMessages: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "Sign in to continue.",
  FORBIDDEN: "You do not have access to this.",
  NOT_FOUND: "Not found.",
  VALIDATION_ERROR: "Check the highlighted fields.",
  ROLE_CLOSED: "This role is no longer accepting submissions.",
  DUPLICATE_EMAIL: "This email already submitted for this role.",
  FILE_TOO_LARGE:
    "That file is over the 2 MB limit. Export a smaller PDF instead.",
  FILE_TYPE_REJECTED: "PDF only. Export a PDF instead.",
  RATE_LIMITED: "Too many submissions. Try again in a few minutes.",
  TURNSTILE_FAILED: "Could not verify you are human. Try again.",
};

/** Duplicate rejection is an inline email error on the apply form, not a separate page. */
const duplicateEmailField = "candidateEmail";

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

function errorEnvelope(
  code: ErrorCode,
  message: string = errorMessages[code],
  fields?: Record<string, string>
): ErrorEnvelope {
  return fields
    ? { error: { code, message, fields } }
    : { error: { code, message } };
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!path || fields[path]) continue;
    fields[path] = issue.message;
  }
  return fields;
}

function validationError(
  error: z.ZodError,
  message: string = errorMessages.VALIDATION_ERROR
): ErrorEnvelope {
  const fields = fieldErrors(error);
  return errorEnvelope(
    "VALIDATION_ERROR",
    message,
    Object.keys(fields).length > 0 ? fields : undefined
  );
}

export {
  duplicateEmailField,
  errorCodeSchema,
  errorCodes,
  errorEnvelope,
  errorEnvelopeSchema,
  errorMessages,
  fieldErrors,
  validationError,
  type ErrorCode,
  type ErrorEnvelope,
};
