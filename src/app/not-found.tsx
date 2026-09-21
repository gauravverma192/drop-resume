import Link from "next/link";

import { PageContainer } from "@/components/chrome/page-container";
import { SiteHeader } from "@/components/chrome/site-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader variant="brand" />
      <PageContainer width="sm">
        <EmptyState
          as="h1"
          title="Page not found"
          description="That URL does not match a role, a job link, or a page in DropResume."
          action={
            <Button asChild>
              <Link href="/">Back home</Link>
            </Button>
          }
        />
      </PageContainer>
    </>
  );
}
