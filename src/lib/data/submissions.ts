import type { SubmissionQuery } from "@/lib/contracts/query";
import { DataError } from "@/lib/data/errors";
import * as memory from "@/lib/data/mock/repository";
import * as postgres from "@/lib/data/prisma/submissions";
import { getRole } from "@/lib/data/roles";
import type { DataRepository } from "@/lib/data/types";

function usesPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function repository() {
  return usesPostgres() ? postgres : memory;
}

const listSubmissions: DataRepository["listSubmissions"] = (ownerId, roleId, query) =>
  repository().listSubmissions(ownerId, roleId, query);

/**
 * CSV of the filtered view is a later todo. Under Postgres we still authorize
 * so a missing role 404s the same way the table does.
 */
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
  repository().submitApplication(input);

const bulkUpdateSubmissionStatus: DataRepository["bulkUpdateSubmissionStatus"] =
  (ownerId, ids, status) =>
    repository().bulkUpdateSubmissionStatus(ownerId, ids, status);

const getSubmissionFile: DataRepository["getSubmissionFile"] = (ownerId, id) =>
  repository().getSubmissionFile(ownerId, id);

const reparseSubmission: DataRepository["reparseSubmission"] = (ownerId, id) =>
  repository().reparseSubmission(ownerId, id);

const updateSubmissionStatus: DataRepository["updateSubmissionStatus"] = (
  ownerId,
  id,
  status
) => repository().updateSubmissionStatus(ownerId, id, status);

export {
  bulkUpdateSubmissionStatus,
  exportSubmissionsCsv,
  getSubmissionFile,
  listSubmissions,
  reparseSubmission,
  submitApplication,
  updateSubmissionStatus,
};
