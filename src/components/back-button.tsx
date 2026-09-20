import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BackButton({
  href,
  label = "Back",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "asChild" | "children"> & {
  href: React.ComponentProps<typeof Link>["href"];
  label?: string;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn("mb-3", className)}
      {...props}
    >
      <Link href={href}>
        <ChevronLeft className="size-[1.125rem]" />
      </Link>
    </Button>
  );
}

export { BackButton };
