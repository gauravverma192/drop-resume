import { AppHeader } from "@/components/chrome/app-header";
import { PageContainer } from "@/components/chrome/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewRoleLoading() {
  return (
    <>
      <AppHeader />
      <PageContainer width="sm">
        <div role="status" aria-label="Loading new role">
          <Skeleton className="mb-3 size-9 rounded-md" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          <Skeleton className="mt-1 h-4 w-2/3" />
          <div className="mt-6 grid gap-3.5">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-30 w-full rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
