import {
  ACCEPTED_RESUME_MIME_TYPES,
  MAX_RESUME_BYTES,
} from "@/lib/contracts/submissions";
import { DataError } from "@/lib/data/errors";

type AcceptedResumeMime = (typeof ACCEPTED_RESUME_MIME_TYPES)[number];

type ResumeFile = {
  bytes: Uint8Array;
  mime: AcceptedResumeMime;
  ext: "pdf";
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
  return null;
}

/**
 * Empty and oversized files are rejected from the declared size before any
 * bytes are read. `readResumeFile` still re-checks the buffer length.
 */
function requireUploadedResume(file: FormDataEntryValue | File | null): File {
  if (!(file instanceof File) || file.size === 0) {
    throw new DataError("VALIDATION_ERROR", "Attach a resume.", {
      resume: "Attach a resume.",
    });
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw new DataError("FILE_TOO_LARGE");
  }
  return file;
}

/**
 * Size and magic-byte checks live here so the mock store and Postgres path
 * cannot drift. The browser MIME string is ignored on purpose.
 */
async function readResumeFile(file: File): Promise<ResumeFile> {
  const uploaded = requireUploadedResume(file);

  const bytes = new Uint8Array(await uploaded.arrayBuffer());
  if (bytes.byteLength > MAX_RESUME_BYTES) {
    throw new DataError("FILE_TOO_LARGE");
  }

  const mime = sniffMime(bytes);
  if (!mime) {
    throw new DataError("FILE_TYPE_REJECTED");
  }

  return {
    bytes,
    mime,
    ext: "pdf",
    fileName: uploaded.name.trim() || "resume.pdf",
    fileSize: bytes.byteLength,
  };
}

function resumeStoragePath(roleId: string, submissionId: string, ext: ResumeFile["ext"]) {
  return `resumes/${roleId}/${submissionId}.${ext}`;
}

function normalizeCandidateEmail(email: string) {
  return email.trim().toLowerCase();
}

export {
  normalizeCandidateEmail,
  readResumeFile,
  requireUploadedResume,
  resumeStoragePath,
  type ResumeFile,
};
