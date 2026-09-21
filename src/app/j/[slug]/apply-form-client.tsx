"use client";

import { useActionState } from "react";

import { ApplyForm } from "@/components/forms/apply-form";

import { submitApplicationAction, type ApplyFormState } from "./actions";

const initialState: ApplyFormState = {};

function ApplyFormClient({ slug }: { slug: string }) {
  const [state, action] = useActionState(submitApplicationAction, initialState);

  return (
    <ApplyForm
      action={action}
      slug={slug}
      defaultValues={state.values}
      errors={state.errors}
    />
  );
}

export { ApplyFormClient };
