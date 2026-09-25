import * as React from "react";

import { cn } from "@/lib/utils";

function ErrorBanner({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      data-slot="error-banner"
      className={cn(
        "rounded-lg bg-destructive-bg px-3 py-2.5 text-[0.8125rem] font-semibold text-destructive",
        className
      )}
      {...props}
    />
  );
}

export { ErrorBanner };
