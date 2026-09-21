import * as React from "react";

import { cn } from "@/lib/utils";

const resultTones = {
  success: {
    tile: "size-16 rounded-2xl bg-success-bg text-success [&_svg]:size-7",
    spacing: "mb-4",
  },
  neutral: {
    tile:
      "size-14 rounded-xl bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] text-muted-foreground [&_svg]:size-6",
    spacing: "mb-3.5",
  },
} as const;

function ResultCard({
  tone = "success",
  icon,
  title,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  tone?: keyof typeof resultTones;
  icon: React.ReactNode;
  title: React.ReactNode;
}) {
  const { tile, spacing } = resultTones[tone];

  return (
    <div
      data-slot="result-card"
      data-tone={tone}
      className={cn("text-center", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn("mx-auto grid place-items-center", tile, spacing)}
      >
        {icon}
      </div>
      <h1 className="font-heading text-[1.375rem] font-bold tracking-[-0.04em] sm:text-2xl">
        {title}
      </h1>
      {children ? (
        <p className="mt-1.5 text-muted-foreground">{children}</p>
      ) : null}
    </div>
  );
}

export { ResultCard, resultTones };
