import { CenteredCardLayout } from "@/components/chrome/centered-card-layout";
import { SiteHeader } from "@/components/chrome/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplyLoading() {
  return (
    <>
      <SiteHeader variant="brand" />
      <CenteredCardLayout>
        <div role="status" aria-label="Loading application" className="grid gap-3">
          <Skeleton className="h-[22px] w-16 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="mt-1 h-11 w-full rounded-md" />
        </div>
      </CenteredCardLayout>
    </>
  );
}
