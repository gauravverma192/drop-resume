"use client";

import * as React from "react";

import { Chip } from "@/components/display/chip";
import { formatRelativeTime } from "@/components/display/relative-time";
import { Score } from "@/components/display/score";
import { StatusBadge } from "@/components/display/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  displayStatus,
  type SubmissionListItem,
} from "@/lib/contracts/submissions";
import { cn } from "@/lib/utils";

function CandidateCard({
  submission,
  selected,
  onSelectedChange,
  onOpenSubmission,
  onRetryParse,
  retrying,
  now,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children" | "onClick"> & {
  submission: SubmissionListItem;
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
  onOpenSubmission?: (submission: SubmissionListItem) => void;
  onRetryParse?: (submission: SubmissionListItem) => void;
  retrying?: boolean;
  now?: Date | string | number;
}) {
  const badge = displayStatus(submission);
  const parsed = submission.parseStatus === "done";
  const submitted = new Date(submission.createdAt);
  // The table pairs the relative label with a tooltip; a tap target can't hold
  // nested focusable text, so the card shows it plain.
  const submittedLabel = (
    <time
      dateTime={submitted.toISOString()}
      // The label is clock-dependent, so server and client can land on either
      // side of a minute boundary.
      suppressHydrationWarning
    >
      {formatRelativeTime(submitted, now == null ? new Date() : new Date(now))}
    </time>
  );

  const openable = onOpenSubmission != null;

  return (
    <div
      data-slot="candidate-card"
      className={cn(
        "flex w-full gap-2.5 rounded-lg border border-border bg-card p-3.5 text-left min-[860px]:hidden",
        className
      )}
      {...props}
    >
      {onSelectedChange ? (
        <div className="pt-0.5">
          <Checkbox
            checked={selected === true}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            aria-label={`Select ${submission.candidateName}`}
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {openable ? (
          <button
            type="button"
            onClick={() => onOpenSubmission(submission)}
            className="w-full text-left outline-none transition-colors hover:text-foreground focus-visible:underline"
          >
            <CardBody
              submission={submission}
              badge={badge}
              parsed={parsed}
              submittedLabel={submittedLabel}
            />
          </button>
        ) : (
          <CardBody
            submission={submission}
            badge={badge}
            parsed={parsed}
            submittedLabel={submittedLabel}
          />
        )}
        {badge === "failed" && onRetryParse ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={retrying}
            onClick={(event) => {
              event.stopPropagation();
              onRetryParse(submission);
            }}
          >
            Retry parse
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CardBody({
  submission,
  badge,
  parsed,
  submittedLabel,
}: {
  submission: SubmissionListItem;
  badge: ReturnType<typeof displayStatus>;
  parsed: boolean;
  submittedLabel: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <strong className="font-semibold">{submission.candidateName}</strong>
        <StatusBadge status={badge} />
      </div>
      <div className="text-muted-foreground">
        {badge === "processing" ? "Resume is being read" : null}
        {badge === "failed" ? (
          <>
            {"Couldn’t parse"} · {submittedLabel}
          </>
        ) : null}
        {parsed
          ? [submission.currentTitle, submission.currentCompany]
              .filter(Boolean)
              .join(" · ") || submission.candidateEmail
          : null}
      </div>
      {parsed ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
          {submission.yearsExperience == null ? null : (
            <span>{submission.yearsExperience} YOE</span>
          )}
          {submission.highlySkilledAt ? (
            <Chip>{submission.highlySkilledAt}</Chip>
          ) : null}
          {submission.matchScore == null ? null : (
            <Score value={submission.matchScore} />
          )}
          {submittedLabel}
        </div>
      ) : null}
    </>
  );
}

export { CandidateCard };
