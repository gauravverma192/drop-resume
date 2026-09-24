import { Prisma } from "@/generated/prisma/client";

import { getPrisma } from "@/lib/data/prisma/client";
import { parseResume } from "@/lib/parsing";
import type { ResumeFields } from "@/lib/parsing/schema";

type ParseJobInput = {
  submissionId: string;
  roleId: string;
  bytes: Uint8Array;
  fileName: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Maps model output onto the AI-written Submission columns. `name` / `email` /
 * `phone` are stored as `parsed*` so they never overwrite what the candidate
 * typed. `companies` has no column and is dropped.
 */
function toSubmissionFields(data: ResumeFields) {
  const scored = data as ResumeFields & {
    matchScore?: number | null;
    matchScoreReason?: string | null;
  };
  return {
    parsedName: data.name,
    parsedEmail: data.email,
    parsedPhone: data.phone,
    currentTitle: data.currentTitle,
    currentCompany: data.currentCompany,
    yearsExperience: data.yearsExperience,
    highlySkilledAt: data.highlySkilledAt,
    location: data.location,
    skills: data.skills,
    education: data.education as Prisma.InputJsonValue,
    aiSummary: data.aiSummary,
    matchScore: scored.matchScore ?? null,
    matchScoreReason: scored.matchScoreReason ?? null,
  };
}

async function markFailed(
  submissionId: string,
  message: string,
  rawText?: string | null
) {
  try {
    await getPrisma().submission.update({
      where: { id: submissionId },
      data: {
        parseStatus: "FAILED",
        parseError: message,
        ...(rawText !== undefined ? { rawText } : {}),
      },
    });
  } catch {
    // The row (and its role) may already have been deleted.
  }
}

/**
 * Reads the role description, runs `parseResume`, and writes DONE with the
 * extracted fields or FAILED with `parseError`. Never throws: `after()` must
 * not surface a parse failure as a submit failure.
 */
async function runParseJob(input: ParseJobInput) {
  const prisma = getPrisma();
  try {
    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: { description: true },
    });

    const result = await parseResume({
      bytes: input.bytes,
      fileName: input.fileName,
      roleDescription: role?.description ?? null,
    });

    if (!result.ok || result.data == null) {
      await markFailed(
        input.submissionId,
        result.error?.message ?? "Resume parse failed.",
        result.rawText
      );
      return;
    }

    await prisma.submission.update({
      where: { id: input.submissionId },
      data: {
        parseStatus: "DONE",
        parseError: null,
        rawText: result.rawText,
        ...toSubmissionFields(result.data),
      },
    });
  } catch (error) {
    await markFailed(
      input.submissionId,
      errorMessage(error, "Resume parse failed.")
    );
  }
}

export { runParseJob, type ParseJobInput };
