import type { SubmissionQuery } from "@/lib/contracts/query";
import { DataError } from "@/lib/data/errors";
import * as memory from "@/lib/data/mock/repository";
import * as postgres from "@/lib/data/prisma/submissions";
import { getRole } from "@/lib/data/roles";
import type { DataRepository } from "@/lib/data/types";

function usesPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Listing still returns an empty page under Postgres until the inbox todo.
 * A role just created in Postgres is not in the mock store, so the mock
 * `ownedRole` check would 404 the inbox — authorize against the real role
 * instead.
 */
async function listSubmissions(
  ownerId: string,
  roleId: string,
  query: SubmissionQuery
) {
  if (!usesPostgres()) {
    return memory.listSubmissions(ownerId, roleId, query);
  }
  const role = await getRole(ownerId, roleId);
  if (!role) throw new DataError("NOT_FOUND");
  return { items: [], page: 1, pageCount: 0, total: 0 };
}

async function exportSubmissionsCsv(
  ownerId: string,
  roleId: string,
  query: SubmissionQuery
) {
  if (!usesPostgres()) {
    return memory.exportSubmissionsCsv(ownerId, roleId, query);
  }
  const role = await getRole(ownerId, roleId);
  if (!role) throw new DataError("NOT_FOUND");
  return [
    "name,email,phone,title,company,yearsExperience,skills,highlySkilledAt,matchScore,status,submitted",
    "",
  ].join("\n");
}

const submitApplication: DataRepository["submitApplication"] = (input) =>
  (usesPostgres() ? postgres : memory).submitApplication(input);

const bulkUpdateSubmissionStatus: DataRepository["bulkUpdateSubmissionStatus"] =
  memory.bulkUpdateSubmissionStatus;
const getSubmissionFile: DataRepository["getSubmissionFile"] =
  memory.getSubmissionFile;
const reparseSubmission: DataRepository["reparseSubmission"] =
  memory.reparseSubmission;
const updateSubmissionStatus: DataRepository["updateSubmissionStatus"] =
  memory.updateSubmissionStatus;

export {
  bulkUpdateSubmissionStatus,
  exportSubmissionsCsv,
  getSubmissionFile,
  listSubmissions,
  reparseSubmission,
  submitApplication,
  updateSubmissionStatus,
};
