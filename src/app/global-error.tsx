"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pt-16 pb-10">
          <EmptyState
            as="h1"
            art={<AlertTriangle className="size-8" />}
            title="Something went wrong"
            description="DropResume hit an unexpected error. Try again."
            action={
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            }
          />
        </main>
      </body>
    </html>
  );
}
