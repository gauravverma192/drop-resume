import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * One entry per data column of candidate-table, in the same order, so the
 * placeholder bars land roughly where the real values will.
 */
const COLUMNS = [
  { head: "w-12", cell: "w-28" }, // Name, which also carries the email line
  { head: "w-8", cell: "w-32" }, // Title
  { head: "w-28", cell: "w-24" }, // Current company
  { head: "w-8", cell: "w-6" }, // YOE
  { head: "w-10", cell: "w-40" }, // Skills
  { head: "w-28", cell: "w-28" }, // Highly skilled at
  { head: "w-10", cell: "w-7" }, // Score
  { head: "w-12", cell: "w-20" }, // Status
  { head: "w-16", cell: "w-14" }, // Submitted
];

function CandidateTableSkeleton({
  rows = 5,
  selectable = true,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  rows?: number;
  selectable?: boolean;
}) {
  const rowKeys = Array.from({ length: rows }, (_, index) => index);

  return (
    <div
      role="status"
      aria-label="Loading candidates"
      data-slot="candidate-table-skeleton"
      className={className}
      {...props}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card max-[860px]:hidden">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow className="hover:bg-secondary">
              {selectable ? (
                <TableHead className="w-9 pl-3">
                  <Skeleton className="size-4 rounded-[4px]" />
                </TableHead>
              ) : null}
              {COLUMNS.map((column, index) => (
                <TableHead key={index}>
                  <Skeleton className={cn("h-2 rounded-full", column.head)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowKeys.map((rowKey) => (
              <TableRow key={rowKey} className="hover:bg-transparent">
                {selectable ? (
                  <TableCell className="pl-3">
                    <Skeleton className="size-4 rounded-[4px]" />
                  </TableCell>
                ) : null}
                {COLUMNS.map((column, index) => (
                  <TableCell key={index}>
                    <Skeleton className={cn("h-3.5", column.cell)} />
                    {index === 0 ? (
                      <Skeleton className="mt-1.5 h-3 w-36" />
                    ) : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-2.5 min-[860px]:hidden">
        {rowKeys.map((rowKey) => (
          <div
            key={rowKey}
            className="rounded-lg border border-border bg-card p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[22px] w-16 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-3.5 w-48 max-w-full" />
            <div className="mt-3 flex items-center gap-3">
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3.5 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { CandidateTableSkeleton };
