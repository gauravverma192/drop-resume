"use client";

import * as React from "react";
import Script from "next/script";

import { cn } from "@/lib/utils";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileOptions = {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: TurnstileOptions
      ) => string | undefined;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

type TurnstileProps = Omit<React.ComponentProps<"div">, "children"> & {
  siteKey?: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  onVerify?: (token: string) => void;
  placeholder?: React.ReactNode;
};

function TurnstileWidget({
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  placeholder = "Cloudflare Turnstile · no site key",
  className,
  ...props
}: TurnstileProps) {
  // No site key means the server skips verification too, so stand in with the
  // striped placeholder rather than a challenge that can never be solved.
  if (!siteKey) {
    return (
      <div
        data-slot="turnstile-placeholder"
        className={cn(
          "grid h-14 place-items-center rounded-md border border-border bg-[repeating-linear-gradient(-45deg,var(--muted)_0,var(--muted)_8px,var(--background)_8px,var(--background)_16px)] px-3 text-center text-xs font-semibold text-muted-foreground",
          className
        )}
        {...props}
      >
        {placeholder}
      </div>
    );
  }

  return <TurnstileChallenge siteKey={siteKey} className={className} {...props} />;
}

function TurnstileChallenge({
  siteKey,
  action,
  theme = "light",
  onVerify,
  className,
  ...props
}: Omit<TurnstileProps, "siteKey" | "placeholder"> & { siteKey: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<string>(undefined);
  const onVerifyRef = React.useRef(onVerify);

  React.useEffect(() => {
    onVerifyRef.current = onVerify;
  });

  React.useEffect(
    () => () => {
      if (!widgetId.current) return;
      window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    },
    []
  );

  function renderWidget() {
    if (widgetId.current || !containerRef.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme,
      callback: (token) => onVerifyRef.current?.(token),
    });
  }

  return (
    <>
      {/* onReady fires on every mount, including one where the script is
          already cached, which a client-side return to the form relies on. */}
      <Script
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      {/* Turnstile fills this container, and with it a hidden
          `cf-turnstile-response` input the surrounding form submits. */}
      <div
        ref={containerRef}
        data-slot="turnstile"
        className={cn("min-h-14", className)}
        {...props}
      />
    </>
  );
}

export { TurnstileWidget };
