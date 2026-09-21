import * as React from "react";

import { Field } from "@/components/forms/field";
import { ResumeDropzone } from "@/components/forms/resume-dropzone";
import { SubmitButton } from "@/components/forms/submit-button";
import { TurnstileWidget } from "@/components/forms/turnstile-widget";
import { Input } from "@/components/ui/input";
import { submitApplicationFormFields } from "@/lib/contracts/submissions";
import { cn } from "@/lib/utils";

type ApplyFormValues = {
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string | null;
};

type ApplyFormErrors = Partial<
  Record<keyof ApplyFormValues | "resume" | "turnstileToken", React.ReactNode>
>;

function ApplyForm({
  action,
  slug,
  defaultValues,
  errors,
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "children" | "action"> & {
  action: React.ComponentProps<"form">["action"];
  slug: string;
  defaultValues?: ApplyFormValues;
  errors?: ApplyFormErrors;
}) {
  return (
    <form
      action={action}
      data-slot="apply-form"
      className={cn("grid gap-3.5", className)}
      {...props}
    >
      <input type="hidden" name={submitApplicationFormFields.slug} value={slug} />
      <Field
        label="Full name"
        htmlFor="candidate-name"
        error={errors?.candidateName}
      >
        <Input
          id="candidate-name"
          name={submitApplicationFormFields.name}
          autoComplete="name"
          required
          defaultValue={defaultValues?.candidateName}
          placeholder="Priya Sharma"
        />
      </Field>
      <Field label="Email" htmlFor="candidate-email" error={errors?.candidateEmail}>
        <Input
          id="candidate-email"
          name={submitApplicationFormFields.email}
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultValues?.candidateEmail}
          placeholder="you@email.com"
        />
      </Field>
      <Field
        label="Phone"
        htmlFor="candidate-phone"
        optional
        error={errors?.candidatePhone}
      >
        <Input
          id="candidate-phone"
          name={submitApplicationFormFields.phone}
          type="tel"
          autoComplete="tel"
          defaultValue={defaultValues?.candidatePhone ?? undefined}
          placeholder="+66 81 234 5678"
        />
      </Field>
      <Field label="Resume" htmlFor="resume" error={errors?.resume}>
        <ResumeDropzone
          id="resume"
          name={submitApplicationFormFields.resume}
          required
        />
      </Field>
      <TurnstileWidget />
      <SubmitButton size="lg" className="mt-1 w-full" pendingLabel="Submitting…">
        Submit application
      </SubmitButton>
    </form>
  );
}

export { ApplyForm, type ApplyFormErrors, type ApplyFormValues };
