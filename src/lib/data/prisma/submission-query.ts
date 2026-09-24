import { Prisma } from "@/generated/prisma/client";

import {
  isSubmissionQuery,
  parseSubmissionQuery,
  type SubmissionQuery,
  type SubmissionQueryInput,
} from "@/lib/contracts/query";
import {
  whereForDisplayStatus,
  type ParseStatus,
  type ReviewStatus,
} from "@/lib/contracts/submissions";
import { getPrisma } from "@/lib/data/prisma/client";

const reviewStatusToPrisma = {
  pending: "PENDING",
  shortlisted: "SHORTLISTED",
  rejected: "REJECTED",
} as const satisfies Record<ReviewStatus, Prisma.SubmissionCreateInput["status"]>;

const parseStatusToPrisma = {
  pending: "PENDING",
  done: "DONE",
  failed: "FAILED",
} as const satisfies Record<ParseStatus, Prisma.SubmissionCreateInput["parseStatus"]>;

function containsInsensitive(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

function asQuery(input: SubmissionQueryInput | SubmissionQuery): SubmissionQuery {
  return isSubmissionQuery(input) ? input : parseSubmissionQuery(input);
}

/**
 * Prisma cannot express "any array element ILIKE %needle%", so skill-contains
 * is an `id IN (...)` built from unnest. Scoped to this role so the list stays
 * small. `position()` is a literal substring — no LIKE wildcards to escape.
 */
async function skillContainsIds(roleId: string, skill: string) {
  const rows = await getPrisma().$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      SELECT s.id
      FROM "Submission" s
      WHERE s."roleId" = ${roleId}
        AND EXISTS (
          SELECT 1
          FROM unnest(s."skills") AS skill
          WHERE position(lower(${skill}) IN lower(skill)) > 0
        )
    `
  );
  return rows.map((row) => row.id);
}

/**
 * Filter half of the inbox query, shared with CSV export so the file cannot
 * drift from the table. Callers add `{ roleId, role: { ownerId } }` themselves
 * so a missing owner filter cannot sneak in here.
 */
async function buildSubmissionWhere(
  searchParams: SubmissionQueryInput | SubmissionQuery,
  roleId: string
): Promise<Prisma.SubmissionWhereInput> {
  const query = asQuery(searchParams);
  const AND: Prisma.SubmissionWhereInput[] = [];

  if (query.status) {
    const status = whereForDisplayStatus(query.status);
    AND.push({
      parseStatus: parseStatusToPrisma[status.parseStatus],
      ...(status.status
        ? { status: reviewStatusToPrisma[status.status] }
        : {}),
    });
  }

  if (query.minYears != null) {
    AND.push({ yearsExperience: { gte: query.minYears } });
  }

  if (query.minScore != null) {
    AND.push({ matchScore: { gte: query.minScore } });
  }

  if (query.q) {
    const contains = containsInsensitive(query.q);
    AND.push({
      OR: [
        { candidateName: contains },
        { currentTitle: contains },
        { currentCompany: contains },
        { rawText: contains },
      ],
    });
  }

  if (query.skill) {
    const ids = await skillContainsIds(roleId, query.skill);
    AND.push({ id: { in: ids.length > 0 ? ids : ["__none__"] } });
  }

  return AND.length > 0 ? { AND } : {};
}

function buildSubmissionOrderBy(
  searchParams: SubmissionQueryInput | SubmissionQuery
): Prisma.SubmissionOrderByWithRelationInput {
  const query = asQuery(searchParams);

  switch (query.sort) {
    case "candidateName":
      return { candidateName: query.dir };
    case "yearsExperience":
      return { yearsExperience: { sort: query.dir, nulls: "last" } };
    case "matchScore":
      return { matchScore: { sort: query.dir, nulls: "last" } };
    default:
      return { createdAt: query.dir };
  }
}

export {
  buildSubmissionOrderBy,
  buildSubmissionWhere,
  parseStatusToPrisma,
  reviewStatusToPrisma,
};
