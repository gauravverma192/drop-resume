import * as memory from "@/lib/data/mock/repository";
import * as postgres from "@/lib/data/prisma/submissions";
import type { DataRepository } from "@/lib/data/types";
import { requestClientIp } from "@/lib/http/client-ip";
import { enforceSubmitRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

function usesPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function repository() {
  return usesPostgres() ? postgres : memory;
}

const listSubmissions: DataRepository["listSubmissions"] = (ownerId, roleId, query) =>
  repository().listSubmissions(ownerId, roleId, query);

const exportSubmissionsCsv: DataRepository["exportSubmissionsCsv"] = (
  ownerId,
  roleId,
  query
) => repository().exportSubmissionsCsv(ownerId, roleId, query);

const submitApplication: DataRepository["submitApplication"] = async (input) => {
  const ip = await requestClientIp();
  await verifyTurnstile(input.turnstileToken, ip);
  await enforceSubmitRateLimit(ip);
  return repository().submitApplication(input);
};

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
