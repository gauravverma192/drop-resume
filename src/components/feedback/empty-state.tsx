import * as React from "react";

import { BrandDroplet } from "@/components/chrome/brand-mark";
import { cn } from "@/lib/utils";

function EmptyState({
  title,
  description,
  action,
  art,
  as: Heading = "h2",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title" | "children"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  art?: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "mt-12 rounded-2xl border border-dashed border-accent-line bg-linear-to-b from-accent-subtle to-background px-6 py-14 text-center",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-[18px] grid size-18 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_30px_color-mix(in_oklch,var(--primary)_28%,transparent)]"
      >
        {art ?? <BrandDroplet className="size-8" />}
      </div>
      <Heading className="font-heading text-[1.375rem] font-bold tracking-[-0.03em]">
        {title}
      </Heading>
      {description ? (
        <p className="mx-auto mt-2 max-w-[420px] text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
