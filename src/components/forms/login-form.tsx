import * as React from "react";

import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Only same-origin paths survive `?next=` — protocol-relative and open redirects do not. */
function internalPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }
  return value;
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.1l.1.1 6.3 5.2C36.8 41.3 44 36 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}

function LoginForm({
  action,
  googleAction,
  next,
  error,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  action: React.ComponentProps<"form">["action"];
  /** Posts rather than links: starting OAuth writes the PKCE verifier cookie. */
  googleAction: React.ComponentProps<"form">["action"];
  next?: string;
  error?: React.ReactNode;
}) {
  const safeNext = internalPath(next);
  const nextField = safeNext ? (
    <input type="hidden" name="next" value={safeNext} />
  ) : null;

  return (
    <div data-slot="login-form" className={cn(className)} {...props}>
      <h1 className="font-heading text-[1.375rem] font-bold tracking-[-0.04em] sm:text-2xl">
        Sign in
      </h1>
      <form action={googleAction}>
        {nextField}
        <SubmitButton
          size="lg"
          variant="outline"
          className="mt-5 w-full bg-background"
          pendingLabel="Redirecting…"
        >
          <GoogleMark />
          Continue with Google
        </SubmitButton>
      </form>
      <div className="relative my-[18px]">
        <Separator />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground">
          OR
        </span>
      </div>
      <form action={action} className="grid gap-3.5">
        {nextField}
        <Field label="Email" htmlFor="email" error={error}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
          />
        </Field>
        <SubmitButton size="lg" className="w-full" pendingLabel="Sending…">
          Send magic link
        </SubmitButton>
      </form>
    </div>
  );
}

export { LoginForm };
