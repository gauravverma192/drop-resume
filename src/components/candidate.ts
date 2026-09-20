import type { SubmissionStatus } from "@/components/status-badge";

/** One row of the inbox. The table, the mobile card, and the drawer all read this shape. */
type Candidate = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  company?: string | null;
  years?: number | null;
  location?: string | null;
  skills?: readonly string[];
  focusAreas?: readonly string[];
  score?: number | null;
  scoreReason?: string | null;
  summary?: string | null;
  resumeUrl?: string | null;
  status: SubmissionStatus;
  submittedAt: Date | string | number;
};

/** Processing and failed submissions have no extracted fields, so there is nothing to open. */
function isCandidateParsed(candidate: Candidate) {
  return candidate.status !== "processing" && candidate.status !== "failed";
}

export { isCandidateParsed, type Candidate };
