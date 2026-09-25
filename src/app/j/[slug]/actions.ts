"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type {
  ApplyFormErrors,
  ApplyFormValues,
} from "@/components/forms/apply-form";
import { duplicateEmailField, fieldErrors } from "@/lib/contracts/errors";
import {
  parseSubmitApplicationFields,
  submitApplicationFormFields,
} from "@/lib/contracts/submissions";
import { DataError, isDataError, submitApplication } from "@/lib/data";
import { requireUploadedResume } from "@/lib/data/resume-file";

type ApplyFormState = {
  errors?: ApplyFormErrors;
  values?: ApplyFormValues;
};

function formError(message: string, values: ApplyFormValues): ApplyFormState {
  return { values, errors: { form: message } };
}

function valuesFrom(formData: FormData): ApplyFormValues {
  return {
    candidateName: String(formData.get(submitApplicationFormFields.name) ?? ""),
    candidateEmail: String(formData.get(submitApplicationFormFields.email) ?? ""),
    candidatePhone:
      String(formData.get(submitApplicationFormFields.phone) ?? "") || null,
  };
}

function errorFor(error: DataError): ApplyFormErrors {
  if (error.code === "DUPLICATE_EMAIL") {
    return { candidateEmail: error.message };
  }
  if (error.code === "FILE_TOO_LARGE" || error.code === "FILE_TYPE_REJECTED") {
    return { resume: error.message };
  }
  if (error.code === "TURNSTILE_FAILED") {
    return { turnstileToken: error.message };
  }
  if (error.fields) {
    return error.fields;
  }
  return { candidateEmail: error.message };
}

async function submitApplicationAction(
  _prev: ApplyFormState,
  formData: FormData
): Promise<ApplyFormState> {
  const values = valuesFrom(formData);

  let input;
  try {
    input = parseSubmitApplicationFields(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields = fieldErrors(error);
      return {
        values,
        errors: {
          candidateName: fields.candidateName,
          candidateEmail: fields.candidateEmail,
          candidatePhone: fields.candidatePhone,
        },
      };
    }
    throw error;
  }

  let result;
  try {
    const file = requireUploadedResume(
      formData.get(submitApplicationFormFields.resume)
    );
    result = await submitApplication({ ...input, file });
  } catch (error) {
    if (isDataError(error)) {
      if (
        error.code === "ROLE_CLOSED" ||
        error.code === "NOT_FOUND" ||
        error.code === "RATE_LIMITED"
      ) {
        return formError(error.message, values);
      }
      if (error.code === "DUPLICATE_EMAIL") {
        return {
          values,
          errors: { [duplicateEmailField]: error.message },
        };
      }
      return { values, errors: errorFor(error) };
    }
    throw error;
  }

  redirect(`/j/${result.slug}/thanks`);
}

export { submitApplicationAction, type ApplyFormState };
