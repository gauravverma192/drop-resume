"use client";

import * as React from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import { RoleForm } from "@/components/forms/role-form";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  deleteRoleAction,
  updateRoleAction,
  type RoleSettingsState,
} from "./actions";

type EditableRole = {
  id: string;
  title: string;
  companyName: string | null;
  description: string | null;
  submissionCount: number;
};

const initialState: RoleSettingsState = {};

function DeleteRole({
  action,
  submissionCount,
}: {
  action: () => void;
  submissionCount: number;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const countLabel = `${submissionCount} ${
    submissionCount === 1 ? "submission" : "submissions"
  }`;

  return (
    <div className="grid gap-1.5">
      <h3 className="font-heading text-sm font-bold tracking-[-0.02em]">
        Delete role
      </h3>
      <p className="text-[0.8125rem] text-muted-foreground">
        The role and its {countLabel} go with it, and the public link stops
        working. This cannot be undone.
      </p>
      {confirming ? (
        <form action={action} className="mt-1.5 flex items-center gap-2">
          <SubmitButton
            variant="destructive"
            size="sm"
            pendingLabel="Deleting…"
          >
            Delete permanently
          </SubmitButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-1.5 w-fit"
          onClick={() => setConfirming(true)}
        >
          Delete role
        </Button>
      )}
    </div>
  );
}

function RoleSettings({ role }: { role: EditableRole }) {
  const [open, setOpen] = React.useState(false);

  // A saved edit closes the sheet and says so, since the header behind it is
  // what shows the new title.
  const save = React.useCallback(
    async (prev: RoleSettingsState, formData: FormData) => {
      const next = await updateRoleAction(role.id, prev, formData);
      if (next.savedAt) {
        setOpen(false);
        toast.success("Role updated");
      }
      return next;
    },
    [role.id]
  );

  const [state, action] = React.useActionState(save, initialState);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Role settings">
          <Settings2 />
        </Button>
      </SheetTrigger>
      <SheetContent
        data-slot="role-settings"
        className="w-[min(420px,92vw)] gap-0 overflow-y-auto p-5 sm:max-w-[420px]"
      >
        <SheetHeader className="p-0 pr-9">
          <SheetTitle className="font-heading text-lg font-bold tracking-[-0.03em]">
            Role settings
          </SheetTitle>
          <SheetDescription>
            Renaming keeps the public link exactly as it is, so anything already
            shared still works.
          </SheetDescription>
        </SheetHeader>

        <RoleForm
          className="mt-4"
          action={action}
          defaultValues={{
            title: state.values?.title ?? role.title,
            companyName: state.values?.companyName ?? role.companyName,
            description: state.values?.description ?? role.description,
          }}
          errors={state.errors}
          submitLabel="Save changes"
          pendingLabel="Saving…"
        />

        <Separator className="my-5" />

        <DeleteRole
          action={deleteRoleAction.bind(null, role.id)}
          submissionCount={role.submissionCount}
        />
      </SheetContent>
    </Sheet>
  );
}

export { RoleSettings };
