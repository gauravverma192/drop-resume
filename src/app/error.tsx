"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { PageContainer } from "@/components/chrome/page-container";
import { SiteHeader } from "@/components/chrome/site-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader variant="brand" />
      <PageContainer width="sm">
        <EmptyState
          as="h1"
          art={<AlertTriangle className="size-8" />}
          title="Something went wrong"
          description="This page didn’t load. Try again, or go back to your roles."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" onClick={reset}>
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back home</Link>
              </Button>
            </div>
          }
        />
      </PageContainer>
    </>
  );
}
