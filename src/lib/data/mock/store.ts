import type { Role } from "@/lib/contracts/roles";
import type {
  ParseStatus,
  ReviewStatus,
  SubmissionListItem,
} from "@/lib/contracts/submissions";

type StoredRole = Role & {
  ownerId: string;
};

type StoredSubmission = SubmissionListItem & {
  roleId: string;
  storagePath: string;
  fileName: string;
  fileMime: string;
  fileSize: number;
  parseError: string | null;
  rawText: string | null;
  bytes: Uint8Array;
};

type Store = {
  roles: Map<string, StoredRole>;
  submissions: Map<string, StoredSubmission>;
};

function emptyStore(): Store {
  return {
    roles: new Map(),
    submissions: new Map(),
  };
}

const globalForStore = globalThis as typeof globalThis & {
  __dropResumeStore?: Store;
};

function getStore(): Store {
  if (!globalForStore.__dropResumeStore) {
    globalForStore.__dropResumeStore = emptyStore();
  }
  return globalForStore.__dropResumeStore;
}

function resetStore(next: Store) {
  globalForStore.__dropResumeStore = next;
}

export { emptyStore, getStore, resetStore };
export type { StoredRole, StoredSubmission, Store, ParseStatus, ReviewStatus };
