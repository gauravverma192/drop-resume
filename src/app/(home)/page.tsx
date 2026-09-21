import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { PageContainer } from "@/components/chrome/page-container";
import { PageHeader } from "@/components/chrome/page-header";
import { SiteHeader } from "@/components/chrome/site-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { RoleCard } from "@/components/roles/role-card";
import { Button } from "@/components/ui/button";
import { appUrl, roleShareUrl } from "@/lib/app-url";
import { getSession } from "@/lib/auth/session";
import { listRoles } from "@/lib/data";

export default async function HomePage() {
  const user = await getSession();

  if (!user) {
    return (
      <>
        <SiteHeader variant="signed-out" />
        <PageContainer>
          <EmptyState
            as="h1"
            title="Share one link. Collect every resume in one list."
            description="Create a role, post the URL, and every candidate lands here with AI-extracted fields you can filter, shortlist, and export."
            action={
              <Button asChild>
                <Link href="/login?next=/roles/new">New role</Link>
              </Button>
            }
          />
        </PageContainer>
      </>
    );
  }

  const [roles, origin] = await Promise.all([listRoles(user.id), appUrl()]);

  return (
    <>
      <SiteHeader variant="signed-in" user={user} signOutAction={signOut} />
      <PageContainer>
        <PageHeader
          title="Roles"
          description="Each role gets a public link candidates can submit to."
          actions={
            <Button asChild>
              <Link href="/roles/new">New role</Link>
            </Button>
          }
        />
        {roles.length === 0 ? (
          <EmptyState
            title="No roles yet"
            description="Create a role, share the link, and candidates will land in one list."
            action={
              <Button asChild>
                <Link href="/roles/new">New role</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                href={`/roles/${role.id}`}
                title={role.title}
                company={role.companyName ?? undefined}
                description={role.description ?? undefined}
                submissionCount={role.submissionCount}
                state={role.isOpen ? "active" : "archived"}
                shareUrl={roleShareUrl(origin, role.slug)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
