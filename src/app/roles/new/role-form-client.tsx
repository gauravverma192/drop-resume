"use client";

import { useActionState } from "react";

import { RoleForm } from "@/components/forms/role-form";

import { createRoleAction, type RoleFormState } from "./actions";

const initialState: RoleFormState = {};

function NewRoleForm() {
  const [state, action] = useActionState(createRoleAction, initialState);

  return (
    <RoleForm
      action={action}
      defaultValues={state.values}
      errors={state.errors}
    />
  );
}

export { NewRoleForm };
