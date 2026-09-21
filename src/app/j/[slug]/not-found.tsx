import Link from "next/link";

import { PageContainer } from "@/components/chrome/page-container";
import { SiteHeader } from "@/components/chrome/site-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function JobNotFound() {
  return (
    <>
      <SiteHeader variant="brand" />
      <PageContainer width="sm">
        <EmptyState
          as="h1"
          title="Role not found"
          description="This apply link is not valid. Check the URL and try again."
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
