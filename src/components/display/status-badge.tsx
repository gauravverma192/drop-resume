import * as React from "react";

import { Badge } from "@/components/ui/badge";

const submissionStatusLabels = {
  pending: "Pending",
  processing: "Processing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  failed: "Failed",
} as const;

const roleStateLabels = {
  active: "Active",
  archived: "Archived",
} as const;

const statusLabels = { ...submissionStatusLabels, ...roleStateLabels };

type SubmissionStatus = keyof typeof submissionStatusLabels;
type RoleState = keyof typeof roleStateLabels;
type Status = keyof typeof statusLabels;

function StatusBadge({
  status,
  label,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  status: Status;
  label?: React.ReactNode;
}) {
  return (
    <Badge data-slot="status-badge" variant={status} {...props}>
      {label ?? statusLabels[status]}
    </Badge>
  );
}

export {
  StatusBadge,
  statusLabels,
  submissionStatusLabels,
  roleStateLabels,
  type Status,
  type SubmissionStatus,
  type RoleState,
};
