import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function RoleListSkeleton({
  count = 3,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  count?: number;
}) {
  return (
    <div
      role="status"
      aria-label="Loading roles"
      data-slot="role-list-skeleton"
      className={cn("grid gap-3", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="grid gap-1.5 rounded-lg border border-border bg-card px-[18px] pt-[18px] pb-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-[18px] w-52 max-w-[60%]" />
            <Skeleton className="size-9 shrink-0 rounded-lg" />
          </div>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/5" />
          <div className="mt-1 flex items-center gap-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-[22px] w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { RoleListSkeleton };
