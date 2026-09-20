import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toInitials(source: string) {
  const words = source.trim().split(/[\s@._-]+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]);
  return letters.join("").toUpperCase() || "?";
}

function UserChip({
  email,
  name,
  initials,
  signOutAction,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  email: string;
  name?: string;
  initials?: string;
  signOutAction?: React.ComponentProps<"form">["action"];
}) {
  return (
    <div
      data-slot="user-chip"
      className={cn(
        "flex min-w-0 items-center gap-2.5 text-[0.8125rem] text-muted-foreground",
        className
      )}
      {...props}
    >
      <Avatar className="size-7">
        <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">
          {initials ?? toInitials(name ?? email)}
        </AvatarFallback>
      </Avatar>
      <span className="hidden truncate sm:inline" title={email}>
        {email}
      </span>
      <form action={signOutAction}>
        <Button type="submit" variant="ghost">
          Sign out
        </Button>
      </form>
    </div>
  );
}

export { UserChip };
