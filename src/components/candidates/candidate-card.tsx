"use client";

import * as React from "react";

import { Chip } from "@/components/display/chip";
import { formatRelativeTime } from "@/components/display/relative-time";
import { Score } from "@/components/display/score";
import { StatusBadge } from "@/components/display/status-badge";
import { Button } from "@/components/ui/button";
import {
  displayStatus,
  type SubmissionListItem,
} from "@/lib/contracts/submissions";
import { cn } from "@/lib/utils";

function isOpenable(submission: SubmissionListItem) {
  return submission.parseStatus === "done";
}

function CandidateCard({
  submission,
  onOpenSubmission,
  onRetryParse,
  retrying,
  now,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children" | "onClick"> & {
  submission: SubmissionListItem;
  onOpenSubmission?: (submission: SubmissionListItem) => void;
  onRetryParse?: (submission: SubmissionListItem) => void;
  retrying?: boolean;
  now?: Date | string | number;
}) {
  const badge = displayStatus(submission);
  const parsed = isOpenable(submission);
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

  const openable = parsed && onOpenSubmission != null;
  const shellClassName = cn(
    "w-full rounded-lg border border-border bg-card p-3.5 text-left outline-none transition-colors min-[860px]:hidden",
    openable &&
      "cursor-pointer hover:border-accent-line focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    className
  );

  const body = (
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
    </>
  );

  if (openable) {
    return (
      <button
        type="button"
        data-slot="candidate-card"
        onClick={() => onOpenSubmission(submission)}
        className={shellClassName}
      >
        {body}
      </button>
    );
  }

  return (
    <div data-slot="candidate-card" className={shellClassName} {...props}>
      {body}
    </div>
  );
}

export { CandidateCard };
