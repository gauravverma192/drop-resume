import { CenteredCardLayout } from "@/components/chrome/centered-card-layout";
import { SiteHeader } from "@/components/chrome/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <>
      <SiteHeader variant="brand" />
      <CenteredCardLayout>
        <div role="status" aria-label="Loading sign in" className="grid gap-3.5">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="mt-1.5 h-11 w-full rounded-md" />
          <Skeleton className="mx-auto h-3 w-8" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </CenteredCardLayout>
    </>
  );
}
