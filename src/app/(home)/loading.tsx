import { AppHeader } from "@/components/chrome/app-header";
import { PageContainer } from "@/components/chrome/page-container";
import { PageHeader } from "@/components/chrome/page-header";
import { RoleListSkeleton } from "@/components/roles/role-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      <AppHeader />
      <PageContainer>
        <PageHeader
          title="Roles"
          description={<Skeleton className="mt-1.5 h-4 w-72 max-w-full" />}
          actions={<Skeleton className="h-9 w-24" />}
        />
        <RoleListSkeleton />
      </PageContainer>
    </>
  );
}
