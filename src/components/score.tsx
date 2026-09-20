import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const scoreTierClasses = {
  high: "text-primary-deep",
  mid: "text-warning",
  low: "text-muted-foreground",
} as const;

type ScoreTier = keyof typeof scoreTierClasses;

function scoreTier(value: number): ScoreTier {
  if (value >= 75) return "high";
  if (value >= 50) return "mid";
  return "low";
}

function Score({
  value,
  reason,
  showTotal = false,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  value: number | null | undefined;
  reason?: string | null;
  showTotal?: boolean;
}) {
  if (value == null) {
    return (
      <span
        data-slot="score"
        className={cn("text-muted-foreground", className)}
        {...props}
      >
        —
      </span>
    );
  }

  const tier = scoreTier(value);
  const score = (
    <span
      data-slot="score"
      data-tier={tier}
      className={cn(
        "font-bold tabular-nums",
        scoreTierClasses[tier],
        reason && "cursor-help",
        className
      )}
      {...(reason ? { tabIndex: 0 } : null)}
      {...props}
    >
      {showTotal ? `${value} / 100` : value}
    </span>
  );

  if (!reason) {
    return score;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{score}</TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

export { Score, scoreTier, type ScoreTier };
