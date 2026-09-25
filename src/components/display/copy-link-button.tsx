"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPIED_DURATION = 1200;

function CopyLinkButton({
  value,
  label = "Copy link",
  copiedLabel = "Copied",
  className,
  onClick,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "asChild" | "value"> & {
  value: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Role cards make the whole surface a link; copying should not follow it.
    event.stopPropagation();
    onClick?.(event);

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error("Couldn’t copy the link. Select it from the address bar instead.");
      return;
    }

    setCopied(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), COPIED_DURATION);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={children ? "default" : "icon"}
      aria-label={children ? undefined : copied ? copiedLabel : label}
      data-copied={copied || undefined}
      className={cn(
        "data-copied:border-success data-copied:text-success",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {copied ? <Check /> : <Copy />}
      {children ? <span>{copied ? copiedLabel : children}</span> : null}
    </Button>
  );
}

export { CopyLinkButton };
