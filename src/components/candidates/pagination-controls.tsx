"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/** First page, last page, and `siblings` either side of the current one. */
function pageItems(page: number, pageCount: number, siblings: number) {
  const items: (number | "ellipsis")[] = [];
  let previous = 0;

  for (let candidate = 1; candidate <= pageCount; candidate++) {
    const near = Math.abs(candidate - page) <= siblings;
    if (candidate !== 1 && candidate !== pageCount && !near) continue;
    if (candidate - previous > 1) items.push("ellipsis");
    items.push(candidate);
    previous = candidate;
  }

  return items;
}

function PaginationControls({
  page,
  pageCount,
  siblings = 1,
  paramKey = "page",
  className,
  ...props
}: Omit<React.ComponentProps<"nav">, "children"> & {
  page: number;
  pageCount: number;
  siblings?: number;
  paramKey?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount < 2) {
    return null;
  }

  function hrefFor(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    // Page one is the default, so it stays out of the URL.
    if (target <= 1) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, String(target));
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function step(target: number, label: string, icon: React.ReactNode) {
    const outOfRange = target < 1 || target > pageCount;
    return (
      <PaginationItem>
        {outOfRange ? (
          <Button variant="outline" size="icon" aria-label={label} disabled>
            {icon}
          </Button>
        ) : (
          <Button variant="outline" size="icon" asChild>
            <Link href={hrefFor(target)} aria-label={label} scroll={false}>
              {icon}
            </Link>
          </Button>
        )}
      </PaginationItem>
    );
  }

  return (
    <Pagination
      data-slot="pagination-controls"
      className={cn("mt-4", className)}
      {...props}
    >
      <PaginationContent className="gap-1.5">
        {step(page - 1, "Previous page", <ChevronLeft />)}
        {pageItems(page, pageCount, siblings).map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <Button
                variant={item === page ? "default" : "outline"}
                size="icon"
                asChild
              >
                <Link
                  href={hrefFor(item)}
                  scroll={false}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Link>
              </Button>
            </PaginationItem>
          )
        )}
        {step(page + 1, "Next page", <ChevronRight />)}
      </PaginationContent>
    </Pagination>
  );
}

export { PaginationControls };
