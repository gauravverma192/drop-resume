import * as React from "react";
import Link from "next/link";

import { CopyLinkButton } from "@/components/display/copy-link-button";
import { StatusBadge, type RoleState } from "@/components/display/status-badge";
import { cn } from "@/lib/utils";

function RoleCard({
  href,
  title,
  company,
  description,
  submissionCount,
  state = "active",
  shareUrl,
  className,
  ...props
}: Omit<React.ComponentProps<"article">, "title" | "children"> & {
  href: React.ComponentProps<typeof Link>["href"];
  title: React.ReactNode;
  company?: React.ReactNode;
  description?: React.ReactNode;
  submissionCount: number;
  state?: RoleState;
  shareUrl?: string;
}) {
  return (
    <article
      data-slot="role-card"
      className={cn(
        "relative grid gap-1.5 rounded-lg border border-border bg-card px-[18px] pt-[18px] pb-4 shadow-card transition-[border-color,box-shadow] hover:border-accent-line hover:shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_8%,transparent)] has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-base font-bold tracking-[-0.03em]">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-lg"
          >
            {title}
          </Link>
        </h3>
        {shareUrl ? (
          <CopyLinkButton value={shareUrl} className="relative shrink-0" />
        ) : null}
      </div>
      {company ? (
        <p className="text-[0.8125rem] font-semibold text-foreground-2">
          {company}
        </p>
      ) : null}
      {description ? (
        <p className="line-clamp-2 text-[0.8125rem] text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.8125rem] text-muted-foreground">
        <span>
          {submissionCount} {submissionCount === 1 ? "submission" : "submissions"}
        </span>
        <StatusBadge status={state} />
      </div>
    </article>
  );
}

export { RoleCard };
