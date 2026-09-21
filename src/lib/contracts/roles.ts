import { z } from "zod";

/** Empty optional text becomes null; omitted stays undefined so PATCH can no-op. */
const nullableText = z.preprocess((value: unknown) => {
  if (value === undefined) return undefined;
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable().optional());

const createRoleSchema = z.object({
  title: z.string().trim().min(1),
  companyName: nullableText,
  description: nullableText,
});

const updateRoleSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    companyName: nullableText,
    description: nullableText,
    isOpen: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.companyName !== undefined ||
      value.description !== undefined ||
      value.isOpen !== undefined,
    { message: "At least one field is required" }
  );

/** Owner-facing role. `ownerId` stays on the server. */
const roleSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string().nullable(),
  slug: z.string(),
  description: z.string().nullable(),
  isOpen: z.boolean(),
  createdAt: z.iso.datetime(),
  submissionCount: z.number().int().nonnegative(),
});

const publicRoleSchema = roleSchema.pick({
  slug: true,
  title: true,
  companyName: true,
  description: true,
  isOpen: true,
});

type CreateRoleInput = z.infer<typeof createRoleSchema>;
type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
type Role = z.infer<typeof roleSchema>;
type PublicRole = z.infer<typeof publicRoleSchema>;

export {
  createRoleSchema,
  publicRoleSchema,
  roleSchema,
  updateRoleSchema,
  type CreateRoleInput,
  type PublicRole,
  type Role,
  type UpdateRoleInput,
};
