"use server";

import { redirect } from "next/navigation";

import type { RoleFormErrors, RoleFormValues } from "@/components/forms/role-form";
import { requirePageUser } from "@/lib/auth/session";
import { fieldErrors } from "@/lib/contracts/errors";
import { createRoleSchema } from "@/lib/contracts/roles";
import { createRole, isDataError } from "@/lib/data";

type RoleFormState = {
  errors?: RoleFormErrors;
  values?: RoleFormValues;
};

async function createRoleAction(
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  const user = await requirePageUser("/roles/new");

  const values: RoleFormValues = {
    title: String(formData.get("title") ?? ""),
    companyName: String(formData.get("companyName") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
  };

  const parsed = createRoleSchema.safeParse({
    title: formData.get("title"),
    companyName: formData.get("companyName"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  let role;
  try {
    role = await createRole(user.id, parsed.data);
  } catch (error) {
    if (isDataError(error)) {
      return { errors: { title: error.message }, values };
    }
    throw error;
  }

  redirect(`/roles/${role.id}`);
}

export { createRoleAction, type RoleFormState };
