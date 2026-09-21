import * as React from "react";

import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RoleFormValues = {
  title?: string;
  companyName?: string | null;
  description?: string | null;
};

type RoleFormErrors = Partial<Record<keyof RoleFormValues, React.ReactNode>>;

function RoleForm({
  action,
  defaultValues,
  errors,
  submitLabel = "Create role",
  pendingLabel = "Creating…",
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "children" | "action"> & {
  action: React.ComponentProps<"form">["action"];
  defaultValues?: RoleFormValues;
  errors?: RoleFormErrors;
  submitLabel?: React.ReactNode;
  pendingLabel?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      data-slot="role-form"
      className={cn("grid gap-3.5", className)}
      {...props}
    >
      <Field label="Title" htmlFor="title" error={errors?.title}>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          placeholder="Senior Backend Engineer"
        />
      </Field>
      <Field
        label="Company name"
        htmlFor="companyName"
        optional
        error={errors?.companyName}
      >
        <Input
          id="companyName"
          name="companyName"
          defaultValue={defaultValues?.companyName ?? undefined}
          placeholder="Shown on the public form"
        />
      </Field>
      <Field
        label="Description"
        htmlFor="description"
        optional
        hint="If you add a description, each resume gets a match score."
        error={errors?.description}
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? undefined}
        />
      </Field>
      <SubmitButton className="mt-1.5 w-fit" pendingLabel={pendingLabel}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

export { RoleForm, type RoleFormErrors, type RoleFormValues };
