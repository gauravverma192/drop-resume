import * as React from "react";
import Link from "next/link";

import { AppHeader } from "@/components/chrome/app-header";
import { UserChip } from "@/components/chrome/user-chip";
import { Button } from "@/components/ui/button";

type SiteHeaderUser = {
  email: string;
  name?: string;
};

function SiteHeader({
  variant,
  user,
  brandHref,
  signInHref = "/login",
  signOutAction,
  className,
  ...props
}: Omit<React.ComponentProps<"header">, "children"> & {
  variant: "brand" | "signed-out" | "signed-in";
  user?: SiteHeaderUser;
  brandHref?: React.ComponentProps<typeof Link>["href"];
  signInHref?: React.ComponentProps<typeof Link>["href"];
  signOutAction?: React.ComponentProps<"form">["action"];
}) {
  return (
    <AppHeader brandHref={brandHref} className={className} {...props}>
      {variant === "signed-out" ? (
        <Button variant="ghost" asChild>
          <Link href={signInHref}>Sign in</Link>
        </Button>
      ) : null}
      {variant === "signed-in" && user ? (
        <UserChip
          email={user.email}
          name={user.name}
          signOutAction={signOutAction}
        />
      ) : null}
    </AppHeader>
  );
}

export { SiteHeader, type SiteHeaderUser };
