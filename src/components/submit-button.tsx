"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type"> & {
  pendingLabel?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      data-pending={pending || undefined}
      {...props}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export { SubmitButton };
