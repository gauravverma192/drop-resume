"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";

import { ChipList } from "@/components/display/chip-list";
import { RelativeTime } from "@/components/display/relative-time";
import { Score } from "@/components/display/score";
import { StatusBadge } from "@/components/display/status-badge";
import { Button } from "@/components/ui/button";
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
import {
  submissionSortHref,
  type SubmissionQuery,
  type SubmissionSort,
} from "@/lib/contracts/query";
import {
  displayStatus,
  type SubmissionListItem,
} from "@/lib/contracts/submissions";
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

function ariaSort(
  field: SubmissionSort,
  query: SubmissionQuery
): React.AriaAttributes["aria-sort"] {
  if (query.sort !== field) return "none";
  return query.dir === "asc" ? "ascending" : "descending";
}

function SortLink({
  field,
  query,
  children,
}: {
  field: SubmissionSort;
  query: SubmissionQuery;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = query.sort === field;

  return (
    <Link
      href={submissionSortHref(pathname, query, field)}
      scroll={false}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {children}
      {active ? (
        query.dir === "asc" ? (
          <ArrowUp className="size-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3" aria-hidden="true" />
        )
      ) : null}
    </Link>
  );
}

function CandidateTable({
  submissions,
  query,
  selectedIds,
  onSelectedIdsChange,
  onOpenSubmission,
  onRetryParse,
  retryingId,
  now,
  empty,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  submissions: readonly SubmissionListItem[];
  query: SubmissionQuery;
  selectedIds?: readonly string[];
  /** Omit to drop the selection column entirely. */
  onSelectedIdsChange?: (ids: string[]) => void;
  onOpenSubmission?: (submission: SubmissionListItem) => void;
  onRetryParse?: (submission: SubmissionListItem) => void;
  retryingId?: string | null;
  now?: Date | string | number;
  empty?: React.ReactNode;
}) {
  const selectable = onSelectedIdsChange != null;
  const selected = React.useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds]
  );

  const allSelected =
    submissions.length > 0 && submissions.every((item) => selected.has(item.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    onSelectedIdsChange?.(checked ? submissions.map((it) => it.id) : []);
  }

  function toggleOne(submission: SubmissionListItem, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(submission.id);
    } else {
      next.delete(submission.id);
    }
    onSelectedIdsChange?.(
      submissions.filter((it) => next.has(it.id)).map((it) => it.id)
    );
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
            <TableHead aria-sort={ariaSort("candidateName", query)}>
              <SortLink field="candidateName" query={query}>
                Name
              </SortLink>
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Current company</TableHead>
            <TableHead aria-sort={ariaSort("yearsExperience", query)}>
              <SortLink field="yearsExperience" query={query}>
                YOE
              </SortLink>
            </TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Highly skilled at</TableHead>
            <TableHead aria-sort={ariaSort("matchScore", query)}>
              <span className="inline-flex items-center gap-1">
                <SortLink field="matchScore" query={query}>
                  Score
                </SortLink>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      className="inline-flex cursor-help items-center"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-3.5 place-items-center rounded-full bg-accent text-[10px] text-accent-foreground"
                      >
                        i
                      </span>
                      <span className="sr-only">{SCORE_HINT}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="normal-case">{SCORE_HINT}</TooltipContent>
                </Tooltip>
              </span>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead aria-sort={ariaSort("createdAt", query)}>
              <SortLink field="createdAt" query={query}>
                Submitted
              </SortLink>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={selectable ? DATA_COLUMN_COUNT + 1 : DATA_COLUMN_COUNT}
                className="p-0"
              >
                {empty}
              </TableCell>
            </TableRow>
          ) : null}
          {submissions.map((submission) => {
            const openable = onOpenSubmission != null;
            const isSelected = selected.has(submission.id);
            const badge = displayStatus(submission);
            const focus = submission.highlySkilledAt
              ? [submission.highlySkilledAt]
              : [];

            return (
              <TableRow
                key={submission.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(openable && "cursor-pointer")}
                onClick={openable ? () => onOpenSubmission(submission) : undefined}
              >
                {selectable ? (
                  <TableCell
                    className="pl-3"
                    // The row opens the drawer, so ticking a box must not also open it.
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleOne(submission, checked === true)
                      }
                      aria-label={`Select ${submission.candidateName}`}
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
                        onOpenSubmission(submission);
                      }}
                    >
                      {submission.candidateName}
                    </button>
                  ) : (
                    <span className="font-semibold">{submission.candidateName}</span>
                  )}
                  <div className="text-muted-foreground">
                    {submission.candidateEmail}
                  </div>
                  {badge === "failed" && onRetryParse ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="mt-1.5"
                      disabled={retryingId === submission.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRetryParse(submission);
                      }}
                    >
                      Retry parse
                    </Button>
                  ) : null}
                </TableCell>
                <TableCell>{value(submission.currentTitle)}</TableCell>
                <TableCell>{value(submission.currentCompany)}</TableCell>
                <TableCell>{value(submission.yearsExperience)}</TableCell>
                <TableCell>
                  {submission.skills.length ? (
                    <ChipList items={submission.skills} max={3} />
                  ) : (
                    <Empty />
                  )}
                </TableCell>
                <TableCell>
                  {focus.length ? <ChipList items={focus} max={2} /> : <Empty />}
                </TableCell>
                <TableCell>
                  <Score
                    value={submission.matchScore}
                    reason={submission.matchScoreReason}
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge status={badge} />
                </TableCell>
                <TableCell>
                  <RelativeTime date={submission.createdAt} now={now} />
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
