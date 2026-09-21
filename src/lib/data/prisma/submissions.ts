import { Prisma } from "@/generated/prisma/client";

import { DataError } from "@/lib/data/errors";
import { createId } from "@/lib/data/ids";
import { getPrisma } from "@/lib/data/prisma/client";
import {
  assertBotCheck,
  normalizeCandidateEmail,
  readResumeFile,
  resumeStoragePath,
} from "@/lib/data/resume-file";
import type { SubmitApplicationParams } from "@/lib/data/types";
import { deleteResume, uploadResume } from "@/lib/storage/resumes";

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

  return { slug: role.slug };
}

export { submitApplication };
