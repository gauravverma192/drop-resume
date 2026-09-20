import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

function BrandDroplet({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        d="M8 2.2C8 2.2 4.4 6.4 4.4 9.1a3.6 3.6 0 1 0 7.2 0C11.6 6.4 8 2.2 8 2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BrandTile({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="brand-tile"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground",
        className
      )}
      {...props}
    >
      <BrandDroplet />
    </span>
  );
}

function BrandMark({
  href = "/",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href" | "children"> & {
  href?: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <Link
      href={href}
      data-slot="brand-mark"
      className={cn(
        "flex items-center gap-2.5 font-heading text-base font-bold tracking-[-0.03em] text-foreground no-underline hover:no-underline",
        className
      )}
      {...props}
    >
      <BrandTile />
      DropResume
    </Link>
  );
}

export { BrandDroplet, BrandMark, BrandTile };
