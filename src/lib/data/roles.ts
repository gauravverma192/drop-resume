import * as memory from "@/lib/data/mock/repository";
import * as postgres from "@/lib/data/prisma/roles";
import type { DataRepository } from "@/lib/data/types";

type RoleRepository = Pick<
  DataRepository,
  | "createRole"
  | "deleteRole"
  | "getPublicRole"
  | "getRole"
  | "listRoles"
  | "updateRole"
>;

/**
 * Roles persist as soon as `DATABASE_URL` is set and fall back to the seeded
 * in-memory store otherwise, so `npm run dev` is useful before a Supabase
 * project exists. Read per call rather than once at import time, because a
 * build reads this module too and must not bake the answer in.
 */
function repository(): RoleRepository {
  return process.env.DATABASE_URL ? postgres : memory;
}

const createRole: RoleRepository["createRole"] = (ownerId, input) =>
  repository().createRole(ownerId, input);

const deleteRole: RoleRepository["deleteRole"] = (ownerId, id) =>
  repository().deleteRole(ownerId, id);

const getPublicRole: RoleRepository["getPublicRole"] = (slug) =>
  repository().getPublicRole(slug);

const getRole: RoleRepository["getRole"] = (ownerId, id) =>
  repository().getRole(ownerId, id);

const listRoles: RoleRepository["listRoles"] = (ownerId) =>
  repository().listRoles(ownerId);

const updateRole: RoleRepository["updateRole"] = (ownerId, id, input) =>
  repository().updateRole(ownerId, id, input);

export {
  createRole,
  deleteRole,
  getPublicRole,
  getRole,
  listRoles,
  updateRole,
  type RoleRepository,
};
