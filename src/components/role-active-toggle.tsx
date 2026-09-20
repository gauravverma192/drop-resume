"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function RoleActiveToggle({
  active,
  onActiveChange,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children" | "onChange"> & {
  active: boolean;
  onActiveChange?: (active: boolean) => void | Promise<void>;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
}) {
  const id = React.useId();
  const [optimisticActive, setOptimisticActive] = React.useOptimistic(active);
  const [isPending, startTransition] = React.useTransition();

  function handleCheckedChange(next: boolean) {
    startTransition(async () => {
      setOptimisticActive(next);
      await onActiveChange?.(next);
    });
  }

  return (
    <div
      data-slot="role-active-toggle"
      data-pending={isPending || undefined}
      aria-busy={isPending}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-input bg-background py-1 pr-2.5 pl-1",
        className
      )}
      {...props}
    >
      <Switch
        id={id}
        checked={optimisticActive}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
      />
      <Label htmlFor={id}>
        {optimisticActive ? activeLabel : inactiveLabel}
      </Label>
    </div>
  );
}

export { RoleActiveToggle };
