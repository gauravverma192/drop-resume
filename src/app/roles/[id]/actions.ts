"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { RoleFormErrors, RoleFormValues } from "@/components/forms/role-form";
import { requirePageUser } from "@/lib/auth/session";
import { fieldErrors } from "@/lib/contracts/errors";
import { updateRoleSchema } from "@/lib/contracts/roles";
import { deleteRole, isDataError, updateRole } from "@/lib/data";

type RoleSettingsState = {
  /** Stamped on every successful save, so a second edit also closes the sheet. */
  savedAt?: number;
  errors?: RoleFormErrors;
  values?: RoleFormValues;
};

/** The role id is bound at render time rather than posted, so the form cannot name another role. */
async function updateRoleAction(
  id: string,
  _prev: RoleSettingsState,
  formData: FormData
): Promise<RoleSettingsState> {
  const user = await requirePageUser(`/roles/${id}`);

  const values: RoleFormValues = {
    title: String(formData.get("title") ?? ""),
    companyName: String(formData.get("companyName") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
  };

  // A blank optional field means the recruiter cleared it, which the contract
  // reads as null. `isOpen` is not in this form; the toggle owns it.
  const parsed = updateRoleSchema.safeParse({
    title: formData.get("title"),
    companyName: formData.get("companyName"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  try {
    await updateRole(user.id, id, parsed.data);
  } catch (error) {
    if (isDataError(error)) {
      return { errors: { title: error.message }, values };
    }
    throw error;
  }

  refresh();
  return { savedAt: Date.now() };
}

async function deleteRoleAction(id: string) {
  const user = await requirePageUser(`/roles/${id}`);

  try {
    await deleteRole(user.id, id);
  } catch (error) {
    // A role that is already gone still belongs back on the dashboard.
    if (!isDataError(error) || error.code !== "NOT_FOUND") throw error;
  }

  redirect("/");
}

export { deleteRoleAction, updateRoleAction, type RoleSettingsState };
