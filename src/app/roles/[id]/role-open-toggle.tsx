"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RoleActiveToggle } from "@/components/roles/role-active-toggle";
import type { ErrorEnvelope } from "@/lib/contracts/errors";

async function errorMessage(response: Response) {
  try {
    const body = (await response.json()) as ErrorEnvelope;
    if (body.error?.message) return body.error.message;
  } catch {
    // Fall through.
  }
  return "Something went wrong.";
}

function RoleOpenToggle({
  roleId,
  isOpen,
}: {
  roleId: string;
  isOpen: boolean;
}) {
  const router = useRouter();

  return (
    <RoleActiveToggle
      active={isOpen}
      onActiveChange={async (active) => {
        const response = await fetch(`/api/roles/${roleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOpen: active }),
        });
        if (!response.ok) {
          toast.error(await errorMessage(response));
          router.refresh();
          return;
        }
        toast.success(active ? "Role is active" : "Role is closed");
        router.refresh();
      }}
    />
  );
}

export { RoleOpenToggle };
