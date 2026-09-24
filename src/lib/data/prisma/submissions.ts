import { after } from "next/server";

import { Prisma } from "@/generated/prisma/client";

import {
  SUBMISSION_PAGE_SIZE,
  submissionQueryOffset,
  type SubmissionQuery,
} from "@/lib/contracts/query";
import {
  submissionFileUrl,
  type ParseStatus,
  type ReviewStatus,
  type SubmissionListItem,
} from "@/lib/contracts/submissions";
import { DataError } from "@/lib/data/errors";
import { createId } from "@/lib/data/ids";
import { getPrisma } from "@/lib/data/prisma/client";
import { runParseJob } from "@/lib/data/prisma/parse-job";
import {
  buildSubmissionOrderBy,
  buildSubmissionWhere,
  reviewStatusToPrisma,
} from "@/lib/data/prisma/submission-query";
import {
  assertBotCheck,
  normalizeCandidateEmail,
  readResumeFile,
  resumeStoragePath,
} from "@/lib/data/resume-file";
import type { SubmitApplicationParams } from "@/lib/data/types";
import {
  deleteResume,
  downloadResume,
  signResumeUrl,
  uploadResume,
} from "@/lib/storage/resumes";

const submissionListItemSelect = {
  id: true,
  candidateName: true,
  candidateEmail: true,
  candidatePhone: true,
  currentTitle: true,
  currentCompany: true,
  yearsExperience: true,
  highlySkilledAt: true,
  location: true,
  skills: true,
  matchScore: true,
  matchScoreReason: true,
  aiSummary: true,
  status: true,
  parseStatus: true,
  createdAt: true,
} satisfies Prisma.SubmissionSelect;

type SubmissionListRow = Prisma.SubmissionGetPayload<{
  select: typeof submissionListItemSelect;
}>;

const reviewStatusFromPrisma = {
  PENDING: "pending",
  SHORTLISTED: "shortlisted",
  REJECTED: "rejected",
} as const satisfies Record<string, ReviewStatus>;

const parseStatusFromPrisma = {
  PENDING: "pending",
  DONE: "done",
  FAILED: "failed",
} as const satisfies Record<string, ParseStatus>;

/** Maps a Prisma row onto the camelCase inbox payload. Dashboard listing reuses this. */
function toListItem(row: SubmissionListRow): SubmissionListItem {
  return {
    id: row.id,
    candidateName: row.candidateName,
    candidateEmail: row.candidateEmail,
    candidatePhone: row.candidatePhone,
    currentTitle: row.currentTitle,
    currentCompany: row.currentCompany,
    yearsExperience: row.yearsExperience,
    highlySkilledAt: row.highlySkilledAt,
    location: row.location,
    skills: row.skills ?? [],
    matchScore: row.matchScore,
    matchScoreReason: row.matchScoreReason,
    aiSummary: row.aiSummary,
    status: reviewStatusFromPrisma[row.status],
    parseStatus: parseStatusFromPrisma[row.parseStatus],
    createdAt: row.createdAt.toISOString(),
    fileUrl: submissionFileUrl(row.id),
  };
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function submitApplication(input: SubmitApplicationParams) {
  const prisma = getPrisma();

  const role = await prisma.role.findUnique({
    where: { slug: input.slug },
    select: { id: true, slug: true, isOpen: true },
  });
  if (!role) throw new DataError("NOT_FOUND");
  if (!role.isOpen) throw new DataError("ROLE_CLOSED");

  assertBotCheck(input.turnstileToken);

  const resume = await readResumeFile(input.file);
  const candidateEmail = normalizeCandidateEmail(input.candidateEmail);

  // Cheap read so a known duplicate never pays for an upload. Concurrent
  // doubles still hit the unique constraint below and clean up the object.
  const existing = await prisma.submission.findUnique({
    where: {
      roleId_candidateEmail: { roleId: role.id, candidateEmail },
    },
    select: { id: true },
  });
  if (existing) throw new DataError("DUPLICATE_EMAIL");

  const id = createId();
  const storagePath = resumeStoragePath(role.id, id, resume.ext);

  await uploadResume(storagePath, resume.bytes, resume.mime);

  try {
    await prisma.submission.create({
      data: {
        id,
        roleId: role.id,
        candidateName: input.candidateName,
        candidateEmail,
        candidatePhone: input.candidatePhone ?? null,
        storagePath,
        fileName: resume.fileName,
        fileMime: resume.mime,
        fileSize: resume.fileSize,
      },
    });
  } catch (error) {
    await deleteResume(storagePath);
    if (isUniqueViolation(error)) {
      throw new DataError("DUPLICATE_EMAIL");
    }
    throw error;
  }

  // Bytes are still in memory, so the parse job skips a storage round-trip.
  after(() =>
    runParseJob({
      submissionId: id,
      roleId: role.id,
      bytes: resume.bytes,
      fileName: resume.fileName,
    })
  );

  return { slug: role.slug };
}

async function reparseSubmission(ownerId: string, id: string) {
  const prisma = getPrisma();

  const row = await prisma.submission.findFirst({
    where: { id, role: { ownerId } },
    select: {
      id: true,
      roleId: true,
      storagePath: true,
      fileName: true,
      parseStatus: true,
    },
  });
  if (!row) throw new DataError("NOT_FOUND");
  if (row.parseStatus !== "FAILED") {
    throw new DataError("VALIDATION_ERROR", "Only failed parses can be retried.");
  }

  // Download before flipping the row so a missing object stays FAILED.
  const bytes = await downloadResume(row.storagePath);

  const updated = await prisma.submission.update({
    where: { id: row.id },
    data: { parseStatus: "PENDING", parseError: null },
    select: submissionListItemSelect,
  });

  after(() =>
    runParseJob({
      submissionId: row.id,
      roleId: row.roleId,
      bytes,
      fileName: row.fileName,
    })
  );

  return toListItem(updated);
}

function ownedBy(ownerId: string): Prisma.SubmissionWhereInput {
  return { role: { ownerId } };
}

async function listSubmissions(
  ownerId: string,
  roleId: string,
  query: SubmissionQuery
) {
  const prisma = getPrisma();
  const role = await prisma.role.findFirst({
    where: { id: roleId, ownerId },
    select: { id: true },
  });
  if (!role) throw new DataError("NOT_FOUND");

  const where: Prisma.SubmissionWhereInput = {
    roleId,
    ...ownedBy(ownerId),
    AND: [await buildSubmissionWhere(query, roleId)],
  };

  const total = await prisma.submission.count({ where });
  const pageCount = total === 0 ? 0 : Math.ceil(total / SUBMISSION_PAGE_SIZE);
  const page = Math.min(query.page, Math.max(pageCount, 1));

  const rows = await prisma.submission.findMany({
    where,
    orderBy: buildSubmissionOrderBy(query),
    skip: submissionQueryOffset({ ...query, page }),
    take: SUBMISSION_PAGE_SIZE,
    select: submissionListItemSelect,
  });

  return {
    items: rows.map(toListItem),
    page,
    pageCount,
    total,
  };
}

async function updateSubmissionStatus(
  ownerId: string,
  id: string,
  status: ReviewStatus
) {
  const prisma = getPrisma();
  const existing = await prisma.submission.findFirst({
    where: { id, ...ownedBy(ownerId) },
    select: { id: true },
  });
  if (!existing) throw new DataError("NOT_FOUND");

  const updated = await prisma.submission.update({
    where: { id: existing.id },
    data: { status: reviewStatusToPrisma[status] },
    select: submissionListItemSelect,
  });
  return toListItem(updated);
}

async function bulkUpdateSubmissionStatus(
  ownerId: string,
  ids: string[],
  status: ReviewStatus
) {
  const result = await getPrisma().submission.updateMany({
    where: { id: { in: ids }, ...ownedBy(ownerId) },
    data: { status: reviewStatusToPrisma[status] },
  });
  return { count: result.count };
}

async function getSubmissionFile(ownerId: string, id: string) {
  const row = await getPrisma().submission.findFirst({
    where: { id, ...ownedBy(ownerId) },
    select: { storagePath: true },
  });
  if (!row) throw new DataError("NOT_FOUND");
  return { kind: "redirect" as const, url: await signResumeUrl(row.storagePath) };
}

export {
  buildSubmissionOrderBy,
  buildSubmissionWhere,
  bulkUpdateSubmissionStatus,
  getSubmissionFile,
  listSubmissions,
  reparseSubmission,
  submitApplication,
  updateSubmissionStatus,
};
