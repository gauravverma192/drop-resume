import * as React from "react";

import { cn } from "@/lib/utils";

function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex w-fit items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Chip };
