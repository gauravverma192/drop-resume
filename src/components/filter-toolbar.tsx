"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  submissionStatusLabels,
  type SubmissionStatus,
} from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_STATUSES = "all";
const COMMIT_DELAY = 300;

/** The keys `buildSubmissionWhere(searchParams)` reads. */
const filterParams = {
  query: "q",
  status: "status",
  minYears: "minYears",
  minScore: "minScore",
  skill: "skill",
} as const;

function DebouncedInput({
  value,
  onCommit,
  delay = COMMIT_DELAY,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onCommit: (value: string) => void;
  delay?: number;
}) {
  const [draft, setDraft] = React.useState(value);
  const committed = React.useRef(value);
  const timeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adopt the URL again when it changes from elsewhere — back button, a reset —
  // but not when it catches up to what this input just pushed.
  React.useEffect(() => {
    if (value === committed.current) return;
    committed.current = value;
    setDraft(value);
  }, [value]);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  function commit(next: string) {
    clearTimeout(timeout.current);
    if (next === committed.current) return;
    committed.current = next;
    onCommit(next);
  }

  return (
    <Input
      value={draft}
      className={cn("h-9 shrink-0", className)}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => commit(next), delay);
      }}
      onBlur={() => commit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit(draft);
        }
      }}
      {...props}
    />
  );
}

function FilterToolbar({
  statuses = Object.keys(submissionStatusLabels) as SubmissionStatus[],
  searchPlaceholder = "Search name, title, company…",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  statuses?: readonly SubmissionStatus[];
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const setFilters = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // A narrower result set invalidates whatever page the reader was on.
      params.delete("page");

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams]
  );

  const read = (key: string) => searchParams.get(key) ?? "";
  const digitsOnly = (value: string) => value.replace(/\D/g, "");

  return (
    <div
      data-slot="filter-toolbar"
      data-pending={isPending || undefined}
      aria-busy={isPending}
      className={cn(
        "mb-4 flex items-center gap-2 overflow-x-auto pb-0.5",
        className
      )}
      {...props}
    >
      <DebouncedInput
        type="search"
        aria-label="Search candidates"
        placeholder={searchPlaceholder}
        className="w-60"
        value={read(filterParams.query)}
        onCommit={(value) => setFilters({ [filterParams.query]: value })}
      />
      <Select
        value={read(filterParams.status) || ALL_STATUSES}
        onValueChange={(value) =>
          setFilters({
            [filterParams.status]: value === ALL_STATUSES ? null : value,
          })
        }
      >
        <SelectTrigger size="sm" className="shrink-0" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {submissionStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DebouncedInput
        inputMode="numeric"
        aria-label="Minimum years of experience"
        placeholder="Min years"
        className="w-27"
        value={read(filterParams.minYears)}
        onCommit={(value) =>
          setFilters({ [filterParams.minYears]: digitsOnly(value) })
        }
      />
      <DebouncedInput
        inputMode="numeric"
        aria-label="Minimum score"
        placeholder="Min score"
        className="w-27"
        value={read(filterParams.minScore)}
        onCommit={(value) =>
          setFilters({ [filterParams.minScore]: digitsOnly(value) })
        }
      />
      <DebouncedInput
        aria-label="Skill contains"
        placeholder="Skill contains"
        className="w-40"
        value={read(filterParams.skill)}
        onCommit={(value) => setFilters({ [filterParams.skill]: value })}
      />
    </div>
  );
}

export { FilterToolbar, filterParams };
