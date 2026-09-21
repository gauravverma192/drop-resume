import { z } from "zod";

const reviewStatuses = ["pending", "shortlisted", "rejected"] as const;
const parseStatuses = ["pending", "done", "failed"] as const;
const displayStatuses = [
  "processing",
  "failed",
  "pending",
  "shortlisted",
  "rejected",
] as const;

const reviewStatusSchema = z.enum(reviewStatuses);
const parseStatusSchema = z.enum(parseStatuses);
const displayStatusSchema = z.enum(displayStatuses);

type ReviewStatus = z.infer<typeof reviewStatusSchema>;
type ParseStatus = z.infer<typeof parseStatusSchema>;
type DisplayStatus = z.infer<typeof displayStatusSchema>;

const MAX_RESUME_BYTES = 2 * 1024 * 1024;
const ACCEPTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

/** Multipart field names on `POST /api/public/submit`. */
const submitApplicationFormFields = {
  slug: "slug",
  name: "name",
  email: "email",
  phone: "phone",
  resume: "resume",
  turnstileToken: "cf-turnstile-response",
} as const;

const nullableText = z.preprocess((value: unknown) => {
  if (value === undefined) return undefined;
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable().optional());

const submitApplicationSchema = z.object({
  slug: z.string().trim().min(1),
  candidateName: z.string().trim().min(1),
  candidateEmail: z.string().trim().pipe(z.email()),
  candidatePhone: nullableText,
  turnstileToken: z.string().optional(),
});

/**
 * One inbox row. JSON is camelCase with lowercase enums.
 * `rawText` and `storagePath` stay off the client.
 */
const submissionListItemSchema = z.object({
  id: z.string(),
  candidateName: z.string(),
  candidateEmail: z.email(),
  candidatePhone: z.string().nullable(),
  currentTitle: z.string().nullable(),
  currentCompany: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  highlySkilledAt: z.string().nullable(),
  location: z.string().nullable(),
  skills: z.array(z.string()),
  matchScore: z.number().int().min(0).max(100).nullable(),
  matchScoreReason: z.string().nullable(),
  aiSummary: z.string().nullable(),
  status: reviewStatusSchema,
  parseStatus: parseStatusSchema,
  createdAt: z.iso.datetime(),
  fileUrl: z.string(),
});

const submissionListSchema = z.object({
  items: z.array(submissionListItemSchema),
  page: z.number().int().min(1),
  pageCount: z.number().int().min(0),
  total: z.number().int().min(0),
});

const updateSubmissionSchema = z.object({
  status: reviewStatusSchema,
});

const bulkUpdateSubmissionsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: reviewStatusSchema,
});

type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
type SubmissionListItem = z.infer<typeof submissionListItemSchema>;
type SubmissionList = z.infer<typeof submissionListSchema>;
type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
type BulkUpdateSubmissionsInput = z.infer<typeof bulkUpdateSubmissionsSchema>;

function submissionFileUrl(id: string) {
  return `/api/submissions/${id}/file`;
}

/** Badge value the toolbar already renders: processing / failed, else the review flag. */
function displayStatus(row: {
  status: ReviewStatus;
  parseStatus: ParseStatus;
}): DisplayStatus {
  if (row.parseStatus === "pending") return "processing";
  if (row.parseStatus === "failed") return "failed";
  return row.status;
}

/** Inverse of `displayStatus` for `?status=` → Prisma/mock where. */
function whereForDisplayStatus(status: DisplayStatus): {
  parseStatus: ParseStatus;
  status?: ReviewStatus;
} {
  if (status === "processing") return { parseStatus: "pending" };
  if (status === "failed") return { parseStatus: "failed" };
  return { parseStatus: "done", status };
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseSubmitApplicationFields(formData: FormData) {
  return submitApplicationSchema.parse({
    slug: stringField(formData, submitApplicationFormFields.slug),
    candidateName: stringField(formData, submitApplicationFormFields.name),
    candidateEmail: stringField(formData, submitApplicationFormFields.email),
    candidatePhone: stringField(formData, submitApplicationFormFields.phone),
    turnstileToken: stringField(
      formData,
      submitApplicationFormFields.turnstileToken
    ),
  });
}

export {
  ACCEPTED_RESUME_MIME_TYPES,
  bulkUpdateSubmissionsSchema,
  displayStatus,
  displayStatuses,
  displayStatusSchema,
  MAX_RESUME_BYTES,
  parseStatusSchema,
  parseStatuses,
  parseSubmitApplicationFields,
  reviewStatusSchema,
  reviewStatuses,
  submissionFileUrl,
  submissionListItemSchema,
  submissionListSchema,
  submitApplicationFormFields,
  submitApplicationSchema,
  updateSubmissionSchema,
  whereForDisplayStatus,
  type BulkUpdateSubmissionsInput,
  type DisplayStatus,
  type ParseStatus,
  type ReviewStatus,
  type SubmissionList,
  type SubmissionListItem,
  type SubmitApplicationInput,
  type UpdateSubmissionInput,
};
