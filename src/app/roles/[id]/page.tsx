import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { FilterToolbar } from "@/components/candidates/filter-toolbar";
import { InboxView } from "@/components/candidates/inbox-view";
import { PaginationControls } from "@/components/candidates/pagination-controls";
import { BackButton } from "@/components/chrome/back-button";
import { PageContainer } from "@/components/chrome/page-container";
import { PageHeader } from "@/components/chrome/page-header";
import { SiteHeader } from "@/components/chrome/site-header";
import { CopyLinkButton } from "@/components/display/copy-link-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { appUrl, roleShareUrl } from "@/lib/app-url";
import { requirePageUser } from "@/lib/auth/session";
import {
  parseSubmissionQuery,
  serializeSubmissionQuery,
  type SubmissionQuery,
} from "@/lib/contracts/query";
import { getRole, isDataError, listSubmissions } from "@/lib/data";

import { RoleOpenToggle } from "./role-open-toggle";
import { RoleSettings } from "./role-settings";

function hasActiveFilters(query: SubmissionQuery) {
  return Boolean(
    query.q ||
      query.status ||
      query.minYears != null ||
      query.minScore != null ||
      query.skill
  );
}

export async function generateMetadata({ params }: PageProps<"/roles/[id]">) {
  const { id } = await params;
  const user = await requirePageUser(`/roles/${id}`);
  const role = await getRole(user.id, id);
  return { title: role ? `${role.title} · DropResume` : "DropResume" };
}

export default async function RoleInboxPage({
  params,
  searchParams,
}: PageProps<"/roles/[id]">) {
  const { id } = await params;
  const rawSearch = await searchParams;
  const user = await requirePageUser(`/roles/${id}`);
  const query = parseSubmissionQuery(rawSearch);

  let role;
  let list;
  try {
    role = await getRole(user.id, id);
    if (!role) notFound();
    list = await listSubmissions(user.id, id, query);
  } catch (error) {
    if (isDataError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const origin = await appUrl();
  const exportQuery = serializeSubmissionQuery(query, { page: 1 });
  const exportHref = exportQuery
    ? `/api/roles/${role.id}/export?${exportQuery}`
    : `/api/roles/${role.id}/export`;
  const countLabel = `${role.submissionCount} ${
    role.submissionCount === 1 ? "submission" : "submissions"
  }`;

  return (
    <>
      <SiteHeader variant="signed-in" user={user} signOutAction={signOut} />
      <PageContainer>
        <BackButton href="/" />
        <PageHeader
          title={role.title}
          description={
            role.companyName ? `${role.companyName} · ${countLabel}` : countLabel
          }
          actions={
            <>
              <RoleOpenToggle roleId={role.id} isOpen={role.isOpen} />
              <CopyLinkButton value={roleShareUrl(origin, role.slug)} />
              <Button variant="outline" size="icon" asChild>
                <a href={exportHref} aria-label="Export CSV">
                  <Download />
                </a>
              </Button>
              <RoleSettings
                role={{
                  id: role.id,
                  title: role.title,
                  companyName: role.companyName,
                  description: role.description,
                  submissionCount: role.submissionCount,
                }}
              />
            </>
          }
        />
        <Suspense>
          <FilterToolbar />
        </Suspense>
        <InboxView
          submissions={list.items}
          query={query}
          now={new Date().toISOString()}
          empty={
            <EmptyState
              title={
                hasActiveFilters(query)
                  ? "No matching candidates"
                  : "No submissions yet"
              }
              description={
                hasActiveFilters(query)
                  ? "Nothing in this role matches those filters. Widen them, or clear them to see everyone."
                  : "Copy the role link and post it. Every resume that comes in lands in this list."
              }
              action={
                hasActiveFilters(query) ? (
                  <Button variant="outline" asChild>
                    <Link href={`/roles/${role.id}`}>Clear filters</Link>
                  </Button>
                ) : (
                  <CopyLinkButton value={roleShareUrl(origin, role.slug)}>
                    Copy link
                  </CopyLinkButton>
                )
              }
            />
          }
        />
        <Suspense>
          <PaginationControls page={list.page} pageCount={list.pageCount} />
        </Suspense>
      </PageContainer>
    </>
  );
}
