import { z } from "zod";

import { displayStatusSchema } from "@/lib/contracts/submissions";

/** Inbox page size — small enough that the seeded backend role paginates. */
const SUBMISSION_PAGE_SIZE = 10;

const submissionSorts = [
  "createdAt",
  "yearsExperience",
  "matchScore",
  "candidateName",
] as const;
const submissionSortDirs = ["asc", "desc"] as const;

const submissionSortSchema = z.enum(submissionSorts);
const submissionSortDirSchema = z.enum(submissionSortDirs);

type SubmissionSort = z.infer<typeof submissionSortSchema>;
type SubmissionSortDir = z.infer<typeof submissionSortDirSchema>;

/**
 * URL keys the inbox toolbar writes and `parseSubmissionQuery` reads.
 * CSV export uses the same parser so the file cannot drift from the table.
 */
const filterParams = {
  query: "q",
  status: "status",
  minYears: "minYears",
  minScore: "minScore",
  skill: "skill",
  page: "page",
  sort: "sort",
  dir: "dir",
} as const;

type FilterParam = (typeof filterParams)[keyof typeof filterParams];

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SubmissionQueryInput = URLSearchParams | SearchParamsRecord;

const submissionQuerySchema = z.object({
  q: z.string().optional(),
  status: displayStatusSchema.optional().catch(undefined),
  minYears: z.coerce.number().nonnegative().optional().catch(undefined),
  minScore: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .catch(undefined),
  skill: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1),
  sort: submissionSortSchema.catch("createdAt"),
  dir: submissionSortDirSchema.catch("desc"),
});

type SubmissionQuery = z.infer<typeof submissionQuerySchema>;

function rawParam(
  input: SubmissionQueryInput | null | undefined,
  key: FilterParam
): string | undefined {
  if (input == null) return undefined;

  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  const value = input[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function readParam(
  input: SubmissionQueryInput | null | undefined,
  key: FilterParam
): string | undefined {
  const value = rawParam(input, key);
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Shared by the inbox page and `GET /api/roles/[id]/export`.
 * Invalid sort/status/numbers fall back rather than 400 — query strings are typed by humans.
 */
function parseSubmissionQuery(
  input?: SubmissionQueryInput | null
): SubmissionQuery {
  return submissionQuerySchema.parse({
    q: readParam(input, filterParams.query),
    status: readParam(input, filterParams.status),
    minYears: readParam(input, filterParams.minYears),
    minScore: readParam(input, filterParams.minScore),
    skill: readParam(input, filterParams.skill),
    page: readParam(input, filterParams.page),
    sort: readParam(input, filterParams.sort),
    dir: readParam(input, filterParams.dir),
  });
}

function submissionQueryOffset(query: SubmissionQuery) {
  return (query.page - 1) * SUBMISSION_PAGE_SIZE;
}

export {
  filterParams,
  parseSubmissionQuery,
  SUBMISSION_PAGE_SIZE,
  submissionQueryOffset,
  submissionQuerySchema,
  submissionSortDirSchema,
  submissionSortDirs,
  submissionSortSchema,
  submissionSorts,
  type FilterParam,
  type SearchParamsRecord,
  type SubmissionQuery,
  type SubmissionQueryInput,
  type SubmissionSort,
  type SubmissionSortDir,
};
