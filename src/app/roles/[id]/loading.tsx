import { AppHeader } from "@/components/chrome/app-header";
import { CandidateTableSkeleton } from "@/components/candidates/candidate-table-skeleton";
import { PageContainer } from "@/components/chrome/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <>
      <AppHeader />
      <PageContainer>
        <Skeleton className="mb-3 size-9 rounded-md" />
        <div className="mb-[22px] flex flex-col gap-4 min-[860px]:flex-row min-[860px]:items-start min-[860px]:justify-between">
          <div>
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        </div>
        <CandidateTableSkeleton />
      </PageContainer>
    </>
  );
}
