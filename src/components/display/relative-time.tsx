import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatDate(date: Date) {
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/** "19 Sep 2026, 4:14 PM" — spelled out so server and client agree on the format. */
function formatTimestamp(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours < 12 ? "AM" : "PM";
  return `${formatDate(date)}, ${hours % 12 || 12}:${minutes} ${suffix}`;
}

function formatRelativeTime(date: Date, now: Date) {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE) {
    return "Just now";
  }

  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  if (days === 0) {
    return elapsed < HOUR
      ? `${Math.floor(elapsed / MINUTE)}m ago`
      : `${Math.floor(elapsed / HOUR)}h ago`;
  }
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 30) {
    return `${days}d ago`;
  }
  return formatDate(date);
}

function RelativeTime({
  date,
  now,
  className,
  ...props
}: Omit<React.ComponentProps<"time">, "children" | "dateTime"> & {
  date: Date | string | number;
  now?: Date | string | number;
}) {
  const value = new Date(date);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          data-slot="relative-time"
          dateTime={value.toISOString()}
          tabIndex={0}
          // The label is clock-dependent, so the server and client renders can
          // land on either side of a minute boundary.
          suppressHydrationWarning
          className={cn("cursor-help text-muted-foreground", className)}
          {...props}
        >
          {formatRelativeTime(value, now == null ? new Date() : new Date(now))}
        </time>
      </TooltipTrigger>
      <TooltipContent>
        <span suppressHydrationWarning>{formatTimestamp(value)}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export { RelativeTime, formatRelativeTime, formatTimestamp };
