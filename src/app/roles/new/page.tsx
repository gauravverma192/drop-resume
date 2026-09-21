import { BackButton } from "@/components/chrome/back-button";
import { PageContainer } from "@/components/chrome/page-container";
import { PageHeader } from "@/components/chrome/page-header";
import { SiteHeader } from "@/components/chrome/site-header";
import { signOut } from "@/app/actions/auth";
import { requirePageUser } from "@/lib/auth/session";

import { NewRoleForm } from "./role-form-client";

export default async function NewRolePage() {
  const user = await requirePageUser("/roles/new");

  return (
    <>
      <SiteHeader variant="signed-in" user={user} signOutAction={signOut} />
      <PageContainer width="sm">
        <BackButton href="/" />
        <PageHeader
          title="New role"
          description="A role is a named bucket. Specific (“Senior Backend Engineer”) or generic (“Hiring fullstack engineers”) both work."
        />
        <NewRoleForm />
      </PageContainer>
    </>
  );
}
