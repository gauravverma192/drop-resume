"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BulkActionBar } from "@/components/candidates/bulk-action-bar";
import { CandidateCard } from "@/components/candidates/candidate-card";
import { CandidateDrawer } from "@/components/candidates/candidate-drawer";
import { CandidateTable } from "@/components/candidates/candidate-table";
import type { ErrorEnvelope } from "@/lib/contracts/errors";
import type { SubmissionQuery } from "@/lib/contracts/query";
import type {
  ReviewStatus,
  SubmissionListItem,
} from "@/lib/contracts/submissions";
import { cn } from "@/lib/utils";

async function errorMessage(response: Response) {
  try {
    const body = (await response.json()) as ErrorEnvelope;
    if (body.error?.message) return body.error.message;
  } catch {
    // Fall through to the generic copy when the envelope is missing.
  }
  return "Something went wrong.";
}

async function mutate(input: RequestInfo, init: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }
}

function InboxView({
  submissions,
  query,
  empty,
  now,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  submissions: readonly SubmissionListItem[];
  query: SubmissionQuery;
  empty?: React.ReactNode;
  now?: Date | string | number;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const pageIdSet = new Set(submissions.map((item) => item.id));
  const visibleSelectedIds = selectedIds.filter((id) => pageIdSet.has(id));
  const openSubmission =
    submissions.find((item) => item.id === openId) ?? null;

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function setSelected(id: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(submissions.filter((item) => next.has(item.id)).map((item) => item.id));
  }

  async function setStatus(ids: string[], status: ReviewStatus) {
    if (ids.length === 0) return;

    const verb = status === "shortlisted" ? "Shortlisted" : "Rejected";

    try {
      if (ids.length === 1) {
        await mutate(`/api/submissions/${ids[0]}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } else {
        await mutate("/api/submissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, status }),
        });
      }
      toast.success(
        ids.length === 1 ? verb : `${ids.length} ${verb.toLowerCase()}`
      );
      setSelectedIds([]);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  async function retryParse(submission: SubmissionListItem) {
    setRetryingId(submission.id);
    try {
      await mutate(`/api/submissions/${submission.id}/reparse`, {
        method: "POST",
      });
      toast.success("Retrying parse");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setRetryingId(null);
    }
  }

  if (submissions.length === 0) {
    return empty ?? null;
  }

  return (
    <div data-slot="inbox-view" className={cn(className)} {...props}>
      <BulkActionBar
        count={visibleSelectedIds.length}
        disabled={isPending}
        onShortlist={() => setStatus(visibleSelectedIds, "shortlisted")}
        onReject={() => setStatus(visibleSelectedIds, "rejected")}
      />
      <CandidateTable
        submissions={submissions}
        query={query}
        selectedIds={visibleSelectedIds}
        onSelectedIdsChange={setSelectedIds}
        onOpenSubmission={(item) => setOpenId(item.id)}
        onRetryParse={retryParse}
        retryingId={retryingId}
        now={now}
      />
      <div className="grid gap-2.5 min-[860px]:hidden">
        {submissions.map((submission) => (
          <CandidateCard
            key={submission.id}
            submission={submission}
            selected={visibleSelectedIds.includes(submission.id)}
            onSelectedChange={(checked) => setSelected(submission.id, checked)}
            onOpenSubmission={(item) => setOpenId(item.id)}
            onRetryParse={retryParse}
            retrying={retryingId === submission.id}
            now={now}
          />
        ))}
      </div>
      <CandidateDrawer
        submission={openSubmission}
        open={openSubmission != null}
        onOpenChange={(next) => {
          if (!next) setOpenId(null);
        }}
        disabled={isPending}
        onShortlist={(item) => setStatus([item.id], "shortlisted")}
        onReject={(item) => setStatus([item.id], "rejected")}
        onRetryParse={retryParse}
        retrying={retryingId === openSubmission?.id}
      />
    </div>
  );
}

export { InboxView };
