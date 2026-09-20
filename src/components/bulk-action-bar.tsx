import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BulkActionBar({
  count,
  onShortlist,
  onReject,
  disabled,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  count: number;
  onShortlist?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}) {
  if (count < 1) {
    return null;
  }

  return (
    <div
      data-slot="bulk-action-bar"
      className={cn(
        "mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-accent-line bg-accent px-3 py-2.5",
        className
      )}
      {...props}
    >
      <strong className="text-[0.8125rem] font-bold text-accent-foreground">
        {count} selected
      </strong>
      <Button type="button" variant="success" size="sm" disabled={disabled} onClick={onShortlist}>
        Shortlist
      </Button>
      <Button type="button" variant="destructive" size="sm" disabled={disabled} onClick={onReject}>
        Reject
      </Button>
      {children}
    </div>
  );
}

export { BulkActionBar };
