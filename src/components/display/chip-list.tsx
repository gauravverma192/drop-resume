import * as React from "react";

import { Chip } from "@/components/display/chip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function ChipList({
  items,
  max,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  items: readonly string[];
  max?: number;
}) {
  if (items.length === 0) {
    return null;
  }

  const visible = max == null ? items : items.slice(0, max);
  const overflow = items.slice(visible.length);

  return (
    <div
      data-slot="chip-list"
      className={cn("flex flex-wrap items-center gap-1", className)}
      {...props}
    >
      {visible.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
      {overflow.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Chip
              tabIndex={0}
              className="cursor-help bg-muted text-muted-foreground"
            >
              +{overflow.length}
            </Chip>
          </TooltipTrigger>
          <TooltipContent>{overflow.join(", ")}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export { ChipList };
