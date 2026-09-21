"use client";

import * as React from "react";

import { ChipList } from "@/components/display/chip-list";
import { Score } from "@/components/display/score";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SubmissionListItem } from "@/lib/contracts/submissions";
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
  submission,
  open,
  onOpenChange,
  onShortlist,
  onReject,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<typeof SheetContent>, "children"> & {
  submission: SubmissionListItem | null | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onShortlist?: (submission: SubmissionListItem) => void;
  onReject?: (submission: SubmissionListItem) => void;
  disabled?: boolean;
}) {
  if (!submission) {
    return null;
  }

  const contact = [submission.candidateEmail, submission.candidatePhone]
    .filter(Boolean)
    .join(" · ");
  const years = submission.yearsExperience;

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
            {submission.candidateName}
          </SheetTitle>
          {contact ? <SheetDescription>{contact}</SheetDescription> : null}
        </SheetHeader>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="success"
            size="sm"
            disabled={disabled}
            onClick={() => onShortlist?.(submission)}
          >
            Shortlist
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled}
            onClick={() => onReject?.(submission)}
          >
            Reject
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={submission.fileUrl} target="_blank" rel="noreferrer">
              Open resume
            </a>
          </Button>
        </div>

        {submission.aiSummary ? (
          <p className="mt-4 rounded-lg border border-accent-line bg-accent-subtle px-3.5 py-3 text-foreground-2">
            {submission.aiSummary}
          </p>
        ) : null}

        <dl className="my-4 grid grid-cols-[92px_1fr] items-baseline gap-x-3 gap-y-2 text-[0.8125rem]">
          {submission.currentTitle ? (
            <DetailRow label="Title">{submission.currentTitle}</DetailRow>
          ) : null}
          {submission.currentCompany ? (
            <DetailRow label="Company">{submission.currentCompany}</DetailRow>
          ) : null}
          {years == null ? null : (
            <DetailRow label="Experience">
              {years} {years === 1 ? "year" : "years"}
            </DetailRow>
          )}
          {submission.highlySkilledAt ? (
            <DetailRow label="Focus">
              <ChipList items={[submission.highlySkilledAt]} />
            </DetailRow>
          ) : null}
          {submission.location ? (
            <DetailRow label="Location">{submission.location}</DetailRow>
          ) : null}
          {submission.matchScore == null ? null : (
            <DetailRow label="Score">
              <Score
                value={submission.matchScore}
                reason={submission.matchScoreReason}
                showTotal
              />
            </DetailRow>
          )}
          {submission.skills.length ? (
            <DetailRow label="Skills">
              <ChipList items={submission.skills} />
            </DetailRow>
          ) : null}
        </dl>
      </SheetContent>
    </Sheet>
  );
}

export { CandidateDrawer };
