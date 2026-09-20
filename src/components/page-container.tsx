import * as React from "react";

import { cn } from "@/lib/utils";

const pageWidths = {
  wide: "max-w-[1120px]",
  sm: "max-w-[560px]",
  narrow: "max-w-[440px]",
  full: "max-w-none",
} as const;

function PageContainer({
  width = "wide",
  className,
  ...props
}: React.ComponentProps<"main"> & {
  width?: keyof typeof pageWidths;
}) {
  return (
    <main
      data-slot="page-container"
      data-width={width}
      className={cn(
        "mx-auto w-full flex-1 px-4 pt-5 pb-10 sm:px-6 sm:pt-7 sm:pb-16",
        pageWidths[width],
        className
      )}
      {...props}
    />
  );
}

export { PageContainer, pageWidths };
