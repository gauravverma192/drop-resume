import * as React from "react";

import { cn } from "@/lib/utils";

function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title" | "children"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "mb-[22px] flex flex-col items-stretch gap-4 min-[860px]:flex-row min-[860px]:flex-wrap min-[860px]:items-start min-[860px]:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-[1.375rem] font-bold tracking-[-0.04em] sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div
          data-slot="page-header-actions"
          className="flex shrink-0 items-center gap-2 min-[860px]:self-start"
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export { PageHeader };
