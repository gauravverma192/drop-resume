import * as React from "react";

import { ErrorBanner } from "@/components/feedback/error-banner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function Field({
  label,
  htmlFor,
  optional = false,
  hint,
  error,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "label"> & {
  label: React.ReactNode;
  /** Id of the control this labels. Omit for a field whose control is not focusable. */
  htmlFor?: string;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  // Wire the hint and error onto the control so call sites stay one element deep.
  const control =
    React.isValidElement<React.AriaAttributes>(children) &&
    (describedBy || error)
      ? React.cloneElement(children, {
          "aria-describedby": children.props["aria-describedby"] ?? describedBy,
          "aria-invalid":
            children.props["aria-invalid"] ?? (error ? true : undefined),
        })
      : children;

  const labelContent = (
    <>
      {label}
      {optional ? <FieldHint>(optional)</FieldHint> : null}
    </>
  );

  return (
    <div data-slot="field" className={cn("grid gap-1.5", className)} {...props}>
      {htmlFor ? (
        <Label htmlFor={htmlFor}>{labelContent}</Label>
      ) : (
        // Nothing focusable to point at, so the caption is a span rather than
        // a label with no control.
        <Label asChild>
          <span>{labelContent}</span>
        </Label>
      )}
      {control}
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
      {error ? (
        <ErrorBanner id={errorId} className="text-xs">
          {error}
        </ErrorBanner>
      ) : null}
    </div>
  );
}

function FieldHint({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="field-hint"
      className={cn("text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Field, FieldHint };
