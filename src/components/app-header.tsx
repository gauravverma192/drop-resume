import * as React from "react";
import type Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

function AppHeader({
  brandHref,
  className,
  children,
  ...props
}: React.ComponentProps<"header"> & {
  brandHref?: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <header
      data-slot="app-header"
      className={cn(
        "sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3.5 sm:px-5",
        className
      )}
      {...props}
    >
      <BrandMark href={brandHref} />
      {children}
    </header>
  );
}

export { AppHeader };
