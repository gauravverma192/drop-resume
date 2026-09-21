import type {
  CreateRoleInput,
  PublicRole,
  Role,
  UpdateRoleInput,
} from "@/lib/contracts/roles";
import type { SubmissionQuery } from "@/lib/contracts/query";
import type {
  ReviewStatus,
  SubmissionList,
  SubmissionListItem,
  SubmitApplicationInput,
} from "@/lib/contracts/submissions";

type SessionUser = {
  id: string;
  email: string;
  name: string;
};

type SubmitApplicationParams = SubmitApplicationInput & {
  file: File;
};

type SubmissionFile = {
  fileName: string;
  fileMime: string;
  bytes: Uint8Array;
};

type DataRepository = {
  listRoles(ownerId: string): Promise<Role[]>;
  getRole(ownerId: string, id: string): Promise<Role | null>;
  createRole(ownerId: string, input: CreateRoleInput): Promise<Role>;
  updateRole(ownerId: string, id: string, input: UpdateRoleInput): Promise<Role>;
  deleteRole(ownerId: string, id: string): Promise<void>;
  getPublicRole(slug: string): Promise<PublicRole | null>;
  listSubmissions(
    ownerId: string,
    roleId: string,
    query: SubmissionQuery
  ): Promise<SubmissionList>;
  exportSubmissionsCsv(
    ownerId: string,
    roleId: string,
    query: SubmissionQuery
  ): Promise<string>;
  submitApplication(input: SubmitApplicationParams): Promise<{ slug: string }>;
  updateSubmissionStatus(
    ownerId: string,
    id: string,
    status: ReviewStatus
  ): Promise<SubmissionListItem>;
  bulkUpdateSubmissionStatus(
    ownerId: string,
    ids: string[],
    status: ReviewStatus
  ): Promise<{ count: number }>;
  reparseSubmission(ownerId: string, id: string): Promise<SubmissionListItem>;
  getSubmissionFile(ownerId: string, id: string): Promise<SubmissionFile>;
};

export type {
  DataRepository,
  SessionUser,
  SubmissionFile,
  SubmitApplicationParams,
};
