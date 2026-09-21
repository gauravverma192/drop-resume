import {
  errorEnvelope,
  errorMessages,
  type ErrorCode,
  type ErrorEnvelope,
} from "@/lib/contracts/errors";

class DataError extends Error {
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message?: string, fields?: Record<string, string>) {
    super(message ?? errorMessages[code]);
    this.name = "DataError";
    this.code = code;
    this.fields = fields;
  }

  toEnvelope(): ErrorEnvelope {
    return errorEnvelope(this.code, this.message, this.fields);
  }
}

function isDataError(error: unknown): error is DataError {
  return error instanceof DataError;
}

export { DataError, isDataError };
