import { displayStatus, type SubmissionListItem } from "@/lib/contracts/submissions";

/** Same columns the mock and Postgres exporters write, in table order plus contact fields. */
const SUBMISSION_CSV_COLUMNS = [
  "name",
  "email",
  "phone",
  "title",
  "company",
  "yearsExperience",
  "skills",
  "highlySkilledAt",
  "matchScore",
  "status",
  "submitted",
] as const;

const HEADER_CHUNK = `${SUBMISSION_CSV_COLUMNS.join(",")}\n`;

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function submissionCsvLine(row: SubmissionListItem) {
  return [
    csvCell(row.candidateName),
    csvCell(row.candidateEmail),
    csvCell(row.candidatePhone ?? ""),
    csvCell(row.currentTitle ?? ""),
    csvCell(row.currentCompany ?? ""),
    csvCell(row.yearsExperience == null ? "" : String(row.yearsExperience)),
    csvCell(row.skills.join("; ")),
    csvCell(row.highlySkilledAt ?? ""),
    csvCell(row.matchScore == null ? "" : String(row.matchScore)),
    csvCell(displayStatus(row)),
    csvCell(row.createdAt),
  ].join(",");
}

function asAsyncIterator<T>(
  rows: Iterable<T> | AsyncIterable<T>
): AsyncIterator<T> {
  if (Symbol.asyncIterator in rows) {
    return rows[Symbol.asyncIterator]();
  }
  const iterator = rows[Symbol.iterator]();
  return {
    next: () => Promise.resolve(iterator.next()),
    return(value) {
      const result = iterator.return?.(value) ?? {
        done: true as const,
        value,
      };
      return Promise.resolve(result);
    },
  };
}

/**
 * Pull-based so a slow download does not buffer the whole file. Callers
 * authorize first, then pass already-filtered rows in the same order as the inbox.
 */
function streamSubmissionCsv(
  rows: Iterable<SubmissionListItem> | AsyncIterable<SubmissionListItem>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = asAsyncIterator(rows);
  let sentHeader = false;

  return new ReadableStream({
    async pull(controller) {
      if (!sentHeader) {
        sentHeader = true;
        controller.enqueue(encoder.encode(HEADER_CHUNK));
        return;
      }
      const next = await iterator.next();
      if (next.done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(`${submissionCsvLine(next.value)}\n`));
    },
    cancel() {
      void iterator.return?.();
    },
  });
}

export { streamSubmissionCsv };
