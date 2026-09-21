import * as React from "react";

import { cn } from "@/lib/utils";

function CenteredCardLayout({
  className,
  cardClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  cardClassName?: string;
}) {
  return (
    <div
      data-slot="centered-card-layout"
      className={cn(
        "flex flex-1 items-center justify-center bg-muted px-5 py-8",
        "[background-image:radial-gradient(1200px_400px_at_50%_-10%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_60%)]",
        className
      )}
      {...props}
    >
      <div
        data-slot="centered-card"
        className={cn(
          "w-full max-w-[440px] rounded-2xl border border-border bg-card p-6 shadow-card",
          cardClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { CenteredCardLayout };
