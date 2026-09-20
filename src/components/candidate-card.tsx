"use client";

import * as React from "react";

import { isCandidateParsed, type Candidate } from "@/components/candidate";
import { Chip } from "@/components/chip";
import { formatRelativeTime } from "@/components/relative-time";
import { Score } from "@/components/score";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

function CandidateCard({
  candidate,
  onOpenCandidate,
  now,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children" | "onClick"> & {
  candidate: Candidate;
  onOpenCandidate?: (candidate: Candidate) => void;
  now?: Date | string | number;
}) {
  const parsed = isCandidateParsed(candidate);
  const submitted = new Date(candidate.submittedAt);
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

  return (
    <button
      type="button"
      data-slot="candidate-card"
      disabled={!parsed || onOpenCandidate == null}
      onClick={onOpenCandidate ? () => onOpenCandidate(candidate) : undefined}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3.5 text-left outline-none transition-colors enabled:hover:border-accent-line focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default min-[860px]:hidden",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <strong className="font-semibold">{candidate.name}</strong>
        <StatusBadge status={candidate.status} />
      </div>
      <div className="text-muted-foreground">
        {candidate.status === "processing" ? "Resume is being read" : null}
        {candidate.status === "failed" ? (
          <>{"Couldn’t parse"} · {submittedLabel}</>
        ) : null}
        {parsed
          ? [candidate.title, candidate.company].filter(Boolean).join(" · ") ||
            candidate.email
          : null}
      </div>
      {parsed ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
          {candidate.years == null ? null : <span>{candidate.years} YOE</span>}
          {candidate.focusAreas?.map((area) => <Chip key={area}>{area}</Chip>)}
          {candidate.score == null ? null : <Score value={candidate.score} />}
          {submittedLabel}
        </div>
      ) : null}
    </button>
  );
}

export { CandidateCard };
