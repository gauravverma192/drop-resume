import {
  ACCEPTED_RESUME_MIME_TYPES,
  MAX_RESUME_BYTES,
} from "@/lib/contracts/submissions";
import { DataError } from "@/lib/data/errors";

type AcceptedResumeMime = (typeof ACCEPTED_RESUME_MIME_TYPES)[number];

type ResumeFile = {
  bytes: Uint8Array;
  mime: AcceptedResumeMime;
  ext: "pdf" | "jpg" | "png";
  fileName: string;
  fileSize: number;
};

function sniffMime(bytes: Uint8Array): AcceptedResumeMime | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  return null;
}

function extensionFor(mime: AcceptedResumeMime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "pdf";
}

/**
 * Size and magic-byte checks live here so the mock store and Postgres path
 * cannot drift. The browser MIME string is ignored on purpose.
 */
async function readResumeFile(file: File): Promise<ResumeFile> {
  if (!(file instanceof File) || file.size === 0) {
    throw new DataError("VALIDATION_ERROR", "Attach a resume.", {
      resume: "Attach a resume.",
    });
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new DataError("FILE_TOO_LARGE");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_RESUME_BYTES) {
    throw new DataError("FILE_TOO_LARGE");
  }

  const mime = sniffMime(bytes);
  if (!mime) {
    throw new DataError("FILE_TYPE_REJECTED");
  }

  const ext = extensionFor(mime);
  return {
    bytes,
    mime,
    ext,
    fileName: file.name.trim() || `resume.${ext}`,
    fileSize: bytes.byteLength,
  };
}

function resumeStoragePath(roleId: string, submissionId: string, ext: ResumeFile["ext"]) {
  return `resumes/${roleId}/${submissionId}.${ext}`;
}

/** Turnstile verification itself is a later todo; this only requires a token when a secret is configured. */
function assertBotCheck(turnstileToken?: string) {
  if (process.env.TURNSTILE_SECRET_KEY && !turnstileToken) {
    throw new DataError("TURNSTILE_FAILED");
  }
}

function normalizeCandidateEmail(email: string) {
  return email.trim().toLowerCase();
}

export {
  assertBotCheck,
  normalizeCandidateEmail,
  readResumeFile,
  resumeStoragePath,
  type ResumeFile,
};
