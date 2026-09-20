"use client";

import * as React from "react";

import type { Candidate } from "@/components/candidate";
import { ChipList } from "@/components/chip-list";
import { Score } from "@/components/score";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function CandidateDrawer({
  candidate,
  open,
  onOpenChange,
  onShortlist,
  onReject,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<typeof SheetContent>, "children"> & {
  candidate: Candidate | null | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onShortlist?: (candidate: Candidate) => void;
  onReject?: (candidate: Candidate) => void;
  disabled?: boolean;
}) {
  if (!candidate) {
    return null;
  }

  const contact = [candidate.email, candidate.phone].filter(Boolean).join(" · ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="candidate-drawer"
        className={cn(
          "w-[min(380px,92vw)] gap-0 overflow-y-auto p-5 sm:max-w-[380px]",
          className
        )}
        {...props}
      >
        <SheetHeader className="p-0 pr-9">
          <SheetTitle className="font-heading text-lg font-bold tracking-[-0.03em]">
            {candidate.name}
          </SheetTitle>
          {contact ? <SheetDescription>{contact}</SheetDescription> : null}
        </SheetHeader>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="success"
            size="sm"
            disabled={disabled}
            onClick={() => onShortlist?.(candidate)}
          >
            Shortlist
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled}
            onClick={() => onReject?.(candidate)}
          >
            Reject
          </Button>
          {candidate.resumeUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                Open resume
              </a>
            </Button>
          ) : null}
        </div>

        {candidate.summary ? (
          <p className="mt-4 rounded-lg border border-accent-line bg-accent-subtle px-3.5 py-3 text-foreground-2">
            {candidate.summary}
          </p>
        ) : null}

        <dl className="my-4 grid grid-cols-[92px_1fr] items-baseline gap-x-3 gap-y-2 text-[0.8125rem]">
          {candidate.title ? (
            <DetailRow label="Title">{candidate.title}</DetailRow>
          ) : null}
          {candidate.company ? (
            <DetailRow label="Company">{candidate.company}</DetailRow>
          ) : null}
          {candidate.years == null ? null : (
            <DetailRow label="Experience">
              {candidate.years} {candidate.years === 1 ? "year" : "years"}
            </DetailRow>
          )}
          {candidate.focusAreas?.length ? (
            <DetailRow label="Focus">
              <ChipList items={candidate.focusAreas} />
            </DetailRow>
          ) : null}
          {candidate.location ? (
            <DetailRow label="Location">{candidate.location}</DetailRow>
          ) : null}
          {candidate.score == null ? null : (
            <DetailRow label="Score">
              <Score
                value={candidate.score}
                reason={candidate.scoreReason}
                showTotal
              />
            </DetailRow>
          )}
          {candidate.skills?.length ? (
            <DetailRow label="Skills">
              <ChipList items={candidate.skills} />
            </DetailRow>
          ) : null}
        </dl>
      </SheetContent>
    </Sheet>
  );
}

export { CandidateDrawer };
