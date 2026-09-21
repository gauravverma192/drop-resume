import { connection } from "next/server";

import {
  SUBMISSION_PAGE_SIZE,
  submissionQueryOffset,
  type SubmissionQuery,
} from "@/lib/contracts/query";
import type {
  CreateRoleInput,
  PublicRole,
  Role,
  UpdateRoleInput,
} from "@/lib/contracts/roles";
import {
  ACCEPTED_RESUME_MIME_TYPES,
  displayStatus,
  MAX_RESUME_BYTES,
  submissionFileUrl,
  whereForDisplayStatus,
  type ReviewStatus,
  type SubmissionList,
  type SubmissionListItem,
} from "@/lib/contracts/submissions";
import { DataError } from "@/lib/data/errors";
import { roleSlug } from "@/lib/data/slug";
import type { SubmitApplicationParams } from "@/lib/data/types";

import { createSeed } from "./seed";
import { getStore, resetStore, type StoredRole, type StoredSubmission } from "./store";

function store() {
  const current = getStore();
  if (current.roles.size === 0 && current.submissions.size === 0) {
    resetStore(createSeed());
  }
  return getStore();
}

async function ready() {
  await connection();
  return store();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function toPublicRole(role: StoredRole): PublicRole {
  return {
    slug: role.slug,
    title: role.title,
    companyName: role.companyName,
    description: role.description,
    isOpen: role.isOpen,
  };
}

function toRole(role: StoredRole, submissionCount: number): Role {
  return {
    id: role.id,
    title: role.title,
    companyName: role.companyName,
    slug: role.slug,
    description: role.description,
    isOpen: role.isOpen,
    createdAt: role.createdAt,
    submissionCount,
  };
}

function toListItem(row: StoredSubmission): SubmissionListItem {
  return {
    id: row.id,
    candidateName: row.candidateName,
    candidateEmail: row.candidateEmail,
    candidatePhone: row.candidatePhone,
    currentTitle: row.currentTitle,
    currentCompany: row.currentCompany,
    yearsExperience: row.yearsExperience,
    highlySkilledAt: row.highlySkilledAt,
    location: row.location,
    skills: row.skills,
    matchScore: row.matchScore,
    matchScoreReason: row.matchScoreReason,
    aiSummary: row.aiSummary,
    status: row.status,
    parseStatus: row.parseStatus,
    createdAt: row.createdAt,
    fileUrl: row.fileUrl,
  };
}

function countFor(roleId: string, submissions: Map<string, StoredSubmission>) {
  let count = 0;
  for (const row of submissions.values()) {
    if (row.roleId === roleId) count += 1;
  }
  return count;
}

function ownedRole(ownerId: string, roleId: string) {
  const role = store().roles.get(roleId);
  if (!role || role.ownerId !== ownerId) return null;
  return role;
}

function matchesQuery(row: StoredSubmission, query: SubmissionQuery) {
  if (query.status) {
    const where = whereForDisplayStatus(query.status);
    if (row.parseStatus !== where.parseStatus) return false;
    if (where.status && row.status !== where.status) return false;
  }

  if (query.minYears != null) {
    if (row.yearsExperience == null || row.yearsExperience < query.minYears) {
      return false;
    }
  }

  if (query.minScore != null) {
    if (row.matchScore == null || row.matchScore < query.minScore) return false;
  }

  if (query.skill) {
    const needle = query.skill.toLowerCase();
    if (!row.skills.some((skill) => skill.toLowerCase().includes(needle))) {
      return false;
    }
  }

  if (query.q) {
    const needle = query.q.toLowerCase();
    const haystack = [
      row.candidateName,
      row.currentTitle,
      row.currentCompany,
      row.rawText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

function compareRows(
  a: StoredSubmission,
  b: StoredSubmission,
  query: SubmissionQuery
) {
  const dir = query.dir === "asc" ? 1 : -1;

  switch (query.sort) {
    case "candidateName":
      return a.candidateName.localeCompare(b.candidateName) * dir;
    case "yearsExperience": {
      const av = a.yearsExperience;
      const bv = b.yearsExperience;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    }
    case "matchScore": {
      const av = a.matchScore;
      const bv = b.matchScore;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    }
    default: {
      const av = Date.parse(a.createdAt);
      const bv = Date.parse(b.createdAt);
      return (av - bv) * dir;
    }
  }
}

function queryRows(roleId: string, query: SubmissionQuery) {
  const rows = [...store().submissions.values()].filter(
    (row) => row.roleId === roleId && matchesQuery(row, query)
  );
  rows.sort((a, b) => compareRows(a, b, query));
  return rows;
}

function sniffMime(bytes: Uint8Array) {
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

function extensionFor(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "pdf";
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

async function listRoles(ownerId: string): Promise<Role[]> {
  const db = await ready();
  return [...db.roles.values()]
    .filter((role) => role.ownerId === ownerId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((role) => toRole(role, countFor(role.id, db.submissions)));
}

async function getRole(ownerId: string, id: string): Promise<Role | null> {
  const db = await ready();
  const role = ownedRole(ownerId, id);
  if (!role) return null;
  return toRole(role, countFor(role.id, db.submissions));
}

async function createRole(ownerId: string, input: CreateRoleInput): Promise<Role> {
  const db = await ready();
  const id = newId("role");
  const role: StoredRole = {
    id,
    ownerId,
    title: input.title,
    companyName: input.companyName ?? null,
    slug: roleSlug(input.title),
    description: input.description ?? null,
    isOpen: true,
    createdAt: new Date().toISOString(),
    submissionCount: 0,
  };
  db.roles.set(id, role);
  return toRole(role, 0);
}

async function updateRole(
  ownerId: string,
  id: string,
  input: UpdateRoleInput
): Promise<Role> {
  const db = await ready();
  const role = ownedRole(ownerId, id);
  if (!role) throw new DataError("NOT_FOUND");

  if (input.title !== undefined) role.title = input.title;
  if (input.companyName !== undefined) role.companyName = input.companyName;
  if (input.description !== undefined) role.description = input.description;
  if (input.isOpen !== undefined) role.isOpen = input.isOpen;

  return toRole(role, countFor(role.id, db.submissions));
}

async function deleteRole(ownerId: string, id: string): Promise<void> {
  const db = await ready();
  const role = ownedRole(ownerId, id);
  if (!role) throw new DataError("NOT_FOUND");

  for (const [submissionId, row] of db.submissions) {
    if (row.roleId === id) db.submissions.delete(submissionId);
  }
  db.roles.delete(id);
}

async function getPublicRole(slug: string): Promise<PublicRole | null> {
  const db = await ready();
  for (const role of db.roles.values()) {
    if (role.slug === slug) return toPublicRole(role);
  }
  return null;
}

async function listSubmissions(
  ownerId: string,
  roleId: string,
  query: SubmissionQuery
): Promise<SubmissionList> {
  await ready();
  if (!ownedRole(ownerId, roleId)) throw new DataError("NOT_FOUND");

  const rows = queryRows(roleId, query);
  const total = rows.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / SUBMISSION_PAGE_SIZE);
  const page = Math.min(query.page, Math.max(pageCount, 1));
  const start = submissionQueryOffset({ ...query, page });
  const items = rows.slice(start, start + SUBMISSION_PAGE_SIZE).map(toListItem);

  return { items, page, pageCount, total };
}

async function exportSubmissionsCsv(
  ownerId: string,
  roleId: string,
  query: SubmissionQuery
): Promise<string> {
  await ready();
  if (!ownedRole(ownerId, roleId)) throw new DataError("NOT_FOUND");

  const rows = queryRows(roleId, query);
  const header = [
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
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
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
      ].join(",")
    ),
  ];

  return `${lines.join("\n")}\n`;
}

async function submitApplication(input: SubmitApplicationParams) {
  const db = await ready();
  let role: StoredRole | undefined;
  for (const candidate of db.roles.values()) {
    if (candidate.slug === input.slug) {
      role = candidate;
      break;
    }
  }
  if (!role) throw new DataError("NOT_FOUND");
  if (!role.isOpen) throw new DataError("ROLE_CLOSED");

  if (process.env.TURNSTILE_SECRET_KEY && !input.turnstileToken) {
    throw new DataError("TURNSTILE_FAILED");
  }

  if (!(input.file instanceof File) || input.file.size === 0) {
    throw new DataError("VALIDATION_ERROR", "Attach a resume.", {
      resume: "Attach a resume.",
    });
  }
  if (input.file.size > MAX_RESUME_BYTES) {
    throw new DataError("FILE_TOO_LARGE");
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (
    !mime ||
    !(ACCEPTED_RESUME_MIME_TYPES as readonly string[]).includes(mime)
  ) {
    throw new DataError("FILE_TYPE_REJECTED");
  }

  const email = input.candidateEmail.toLowerCase();
  for (const row of db.submissions.values()) {
    if (row.roleId === role.id && row.candidateEmail.toLowerCase() === email) {
      throw new DataError("DUPLICATE_EMAIL");
    }
  }

  const id = newId("sub");
  const ext = extensionFor(mime);
  const row: StoredSubmission = {
    id,
    roleId: role.id,
    candidateName: input.candidateName,
    candidateEmail: email,
    candidatePhone: input.candidatePhone ?? null,
    currentTitle: null,
    currentCompany: null,
    yearsExperience: null,
    highlySkilledAt: null,
    location: null,
    skills: [],
    matchScore: null,
    matchScoreReason: null,
    aiSummary: null,
    status: "pending",
    parseStatus: "pending",
    createdAt: new Date().toISOString(),
    fileUrl: submissionFileUrl(id),
    storagePath: `resumes/${role.id}/${id}.${ext}`,
    fileName: input.file.name || `resume.${ext}`,
    fileMime: mime,
    fileSize: bytes.byteLength,
    parseError: null,
    rawText: null,
    bytes,
  };
  db.submissions.set(id, row);

  return { slug: role.slug };
}

async function ownedSubmission(ownerId: string, id: string) {
  const db = store();
  const row = db.submissions.get(id);
  if (!row) return null;
  const role = ownedRole(ownerId, row.roleId);
  if (!role) return null;
  return row;
}

async function updateSubmissionStatus(
  ownerId: string,
  id: string,
  status: ReviewStatus
): Promise<SubmissionListItem> {
  await ready();
  const row = await ownedSubmission(ownerId, id);
  if (!row) throw new DataError("NOT_FOUND");
  row.status = status;
  return toListItem(row);
}

async function bulkUpdateSubmissionStatus(
  ownerId: string,
  ids: string[],
  status: ReviewStatus
) {
  await ready();
  let count = 0;
  for (const id of ids) {
    const row = await ownedSubmission(ownerId, id);
    if (!row) continue;
    row.status = status;
    count += 1;
  }
  return { count };
}

async function reparseSubmission(ownerId: string, id: string) {
  await ready();
  const row = await ownedSubmission(ownerId, id);
  if (!row) throw new DataError("NOT_FOUND");
  if (row.parseStatus !== "failed") {
    throw new DataError("VALIDATION_ERROR", "Only failed parses can be retried.");
  }

  row.parseStatus = "done";
  row.parseError = null;
  row.currentTitle = row.currentTitle ?? "Software Engineer";
  row.currentCompany = row.currentCompany ?? "Unknown";
  row.yearsExperience = row.yearsExperience ?? 3;
  row.highlySkilledAt = row.highlySkilledAt ?? "Fullstack";
  row.location = row.location ?? null;
  row.skills = row.skills.length > 0 ? row.skills : ["JavaScript"];
  row.aiSummary =
    row.aiSummary ?? "Parsed after retry. Placeholder fields until Gemini is wired.";
  row.rawText = row.rawText ?? `${row.candidateName}\n${row.currentTitle}`;
  return toListItem(row);
}

async function getSubmissionFile(ownerId: string, id: string) {
  await ready();
  const row = await ownedSubmission(ownerId, id);
  if (!row) throw new DataError("NOT_FOUND");
  return {
    fileName: row.fileName,
    fileMime: row.fileMime,
    bytes: row.bytes,
  };
}

export {
  bulkUpdateSubmissionStatus,
  createRole,
  deleteRole,
  exportSubmissionsCsv,
  getPublicRole,
  getRole,
  getSubmissionFile,
  listRoles,
  listSubmissions,
  reparseSubmission,
  submitApplication,
  updateRole,
  updateSubmissionStatus,
};
