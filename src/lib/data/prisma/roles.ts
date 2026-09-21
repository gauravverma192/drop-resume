import { Prisma } from "@/generated/prisma/client";

import type {
  CreateRoleInput,
  PublicRole,
  Role,
  UpdateRoleInput,
} from "@/lib/contracts/roles";
import { DataError } from "@/lib/data/errors";
import { getPrisma } from "@/lib/data/prisma/client";
import { roleSlug } from "@/lib/data/slug";

/** How many fresh suffixes a create will try before giving up. */
const SLUG_ATTEMPTS = 5;

const roleSelect = {
  id: true,
  title: true,
  companyName: true,
  slug: true,
  description: true,
  isOpen: true,
  createdAt: true,
  _count: { select: { submissions: true } },
} satisfies Prisma.RoleSelect;

const publicRoleSelect = {
  slug: true,
  title: true,
  companyName: true,
  description: true,
  isOpen: true,
} satisfies Prisma.RoleSelect;

type RoleRow = Prisma.RoleGetPayload<{ select: typeof roleSelect }>;

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    slug: row.slug,
    description: row.description,
    isOpen: row.isOpen,
    createdAt: row.createdAt.toISOString(),
    submissionCount: row._count.submissions,
  };
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Every write scopes on `{ id, ownerId }`, so somebody else's role and a role
 * that never existed both come back as P2025 and get the same answer. Leaking
 * the difference would confirm the id is real.
 */
function rethrowAsNotFound(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    throw new DataError("NOT_FOUND");
  }
  throw error;
}

async function listRoles(ownerId: string): Promise<Role[]> {
  const rows = await getPrisma().role.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: roleSelect,
  });
  return rows.map(toRole);
}

async function getRole(ownerId: string, id: string): Promise<Role | null> {
  const row = await getPrisma().role.findFirst({
    where: { id, ownerId },
    select: roleSelect,
  });
  return row ? toRole(row) : null;
}

async function createRole(
  ownerId: string,
  input: CreateRoleInput
): Promise<Role> {
  const prisma = getPrisma();

  for (let attempt = 1; ; attempt += 1) {
    try {
      const row = await prisma.role.create({
        data: {
          ownerId,
          title: input.title,
          companyName: input.companyName ?? null,
          description: input.description ?? null,
          slug: roleSlug(input.title),
        },
        select: roleSelect,
      });
      return toRole(row);
    } catch (error) {
      // `slug` is the only unique constraint on Role, so a conflict here means
      // two roles rolled the same suffix. Another roll settles it.
      if (attempt >= SLUG_ATTEMPTS || !isUniqueViolation(error)) throw error;
    }
  }
}

async function updateRole(
  ownerId: string,
  id: string,
  input: UpdateRoleInput
): Promise<Role> {
  try {
    // An omitted field is `undefined`, which Prisma leaves alone; an explicit
    // `null` from the contract clears the column.
    const row = await getPrisma().role.update({
      where: { id, ownerId },
      data: {
        title: input.title,
        companyName: input.companyName,
        description: input.description,
        isOpen: input.isOpen,
      },
      select: roleSelect,
    });
    return toRole(row);
  } catch (error) {
    rethrowAsNotFound(error);
  }
}

async function deleteRole(ownerId: string, id: string): Promise<void> {
  try {
    // Submissions go with it through `onDelete: Cascade`.
    await getPrisma().role.delete({ where: { id, ownerId } });
  } catch (error) {
    rethrowAsNotFound(error);
  }
}

/** Unscoped by design: the public form has no signed-in user. */
async function getPublicRole(slug: string): Promise<PublicRole | null> {
  return getPrisma().role.findUnique({
    where: { slug },
    select: publicRoleSelect,
  });
}

export {
  createRole,
  deleteRole,
  getPublicRole,
  getRole,
  listRoles,
  updateRole,
};
