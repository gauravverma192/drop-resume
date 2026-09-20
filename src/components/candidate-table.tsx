"use client";

import * as React from "react";

import { isCandidateParsed, type Candidate } from "@/components/candidate";
import { ChipList } from "@/components/chip-list";
import { RelativeTime } from "@/components/relative-time";
import { Score } from "@/components/score";
import { StatusBadge } from "@/components/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SCORE_HINT =
  "0–100 match against this role's description. Empty if the role has no description.";

const DATA_COLUMN_COUNT = 9;

function Empty() {
  return <span className="text-muted-foreground">—</span>;
}

/** Renders the value, or the mock's em dash when a field was never extracted. */
function value(content: React.ReactNode) {
  return content == null || content === "" ? <Empty /> : content;
}

function CandidateTable({
  candidates,
  selectedIds,
  onSelectedIdsChange,
  onOpenCandidate,
  now,
  empty,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  candidates: readonly Candidate[];
  selectedIds?: readonly string[];
  /** Omit to drop the selection column entirely. */
  onSelectedIdsChange?: (ids: string[]) => void;
  onOpenCandidate?: (candidate: Candidate) => void;
  now?: Date | string | number;
  empty?: React.ReactNode;
}) {
  const selectable = onSelectedIdsChange != null;
  const selected = React.useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds]
  );

  const allSelected = candidates.length > 0 && selected.size >= candidates.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    onSelectedIdsChange?.(checked ? candidates.map((it) => it.id) : []);
  }

  function toggleOne(candidate: Candidate, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(candidate.id);
    } else {
      next.delete(candidate.id);
    }
    onSelectedIdsChange?.(candidates.filter((it) => next.has(it.id)).map((it) => it.id));
  }

  return (
    <div
      data-slot="candidate-table"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card max-[860px]:hidden",
        className
      )}
      {...props}
    >
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow className="hover:bg-secondary">
            {selectable ? (
              <TableHead className="w-9 pl-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="Select all candidates"
                />
              </TableHead>
            ) : null}
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Current company</TableHead>
            <TableHead>YOE</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Highly skilled at</TableHead>
            <TableHead>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex cursor-help items-center gap-1">
                    Score
                    <span
                      aria-hidden="true"
                      className="grid size-3.5 place-items-center rounded-full bg-accent text-[10px] text-accent-foreground"
                    >
                      i
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="normal-case">{SCORE_HINT}</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={selectable ? DATA_COLUMN_COUNT + 1 : DATA_COLUMN_COUNT}
                className="p-0"
              >
                {empty}
              </TableCell>
            </TableRow>
          ) : null}
          {candidates.map((candidate) => {
            const openable = onOpenCandidate != null && isCandidateParsed(candidate);
            const isSelected = selected.has(candidate.id);

            return (
              <TableRow
                key={candidate.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(openable && "cursor-pointer")}
                onClick={openable ? () => onOpenCandidate(candidate) : undefined}
              >
                {selectable ? (
                  <TableCell
                    className="pl-3"
                    // The row opens the drawer, so ticking a box must not also open it.
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => toggleOne(candidate, checked === true)}
                      aria-label={`Select ${candidate.name}`}
                    />
                  </TableCell>
                ) : null}
                <TableCell>
                  {openable ? (
                    <button
                      type="button"
                      className="font-semibold outline-none focus-visible:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCandidate(candidate);
                      }}
                    >
                      {candidate.name}
                    </button>
                  ) : (
                    <span className="font-semibold">{candidate.name}</span>
                  )}
                  <div className="text-muted-foreground">{candidate.email}</div>
                </TableCell>
                <TableCell>{value(candidate.title)}</TableCell>
                <TableCell>{value(candidate.company)}</TableCell>
                <TableCell>{value(candidate.years)}</TableCell>
                <TableCell>
                  {candidate.skills?.length ? (
                    <ChipList items={candidate.skills} max={3} />
                  ) : (
                    <Empty />
                  )}
                </TableCell>
                <TableCell>
                  {candidate.focusAreas?.length ? (
                    <ChipList items={candidate.focusAreas} max={2} />
                  ) : (
                    <Empty />
                  )}
                </TableCell>
                <TableCell>
                  <Score value={candidate.score} reason={candidate.scoreReason} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={candidate.status} />
                </TableCell>
                <TableCell>
                  <RelativeTime date={candidate.submittedAt} now={now} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { CandidateTable };
