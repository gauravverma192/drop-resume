import { NextResponse } from "next/server";
import { z } from "zod";

import { duplicateEmailField, validationError } from "@/lib/contracts/errors";
import {
  parseSubmitApplicationFields,
  submitApplicationFormFields,
} from "@/lib/contracts/submissions";
import { DataError, isDataError, submitApplication } from "@/lib/data";
import { caughtErrorResponse, jsonError } from "@/lib/http/api";

/** NVIDIA alone was 19.5s plus Docling; `after()` shares this budget. */
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    let input;
    try {
      input = parseSubmitApplicationFields(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(validationError(error));
      }
      throw error;
    }

    const file = formData.get(submitApplicationFormFields.resume);
    if (!(file instanceof File) || file.size === 0) {
      throw new DataError("VALIDATION_ERROR", "Attach a resume.", {
        resume: "Attach a resume.",
      });
    }

    const result = await submitApplication({ ...input, file });
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(new URL(`/j/${result.slug}/thanks`, origin), 303);
  } catch (error) {
    if (isDataError(error) && error.code === "DUPLICATE_EMAIL") {
      return jsonError(
        new DataError(error.code, error.message, {
          [duplicateEmailField]: error.message,
        })
      );
    }
    return caughtErrorResponse(error);
  }
}
