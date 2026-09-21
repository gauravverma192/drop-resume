import Link from "next/link";

import { PageContainer } from "@/components/chrome/page-container";
import { SiteHeader } from "@/components/chrome/site-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function RoleNotFound() {
  return (
    <>
      <SiteHeader variant="brand" />
      <PageContainer width="sm">
        <EmptyState
          as="h1"
          title="Role not found"
          description="That role does not exist, or you do not have access to it."
          action={
            <Button asChild>
              <Link href="/">Back to roles</Link>
            </Button>
          }
        />
      </PageContainer>
    </>
  );
}
