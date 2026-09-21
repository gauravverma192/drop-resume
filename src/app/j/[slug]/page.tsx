import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { CenteredCardLayout } from "@/components/chrome/centered-card-layout";
import { SiteHeader } from "@/components/chrome/site-header";
import { StatusBadge } from "@/components/display/status-badge";
import { ResultCard } from "@/components/feedback/result-card";
import { getPublicRole } from "@/lib/data";

import { ApplyFormClient } from "./apply-form-client";

export async function generateMetadata({ params }: PageProps<"/j/[slug]">) {
  const { slug } = await params;
  const role = await getPublicRole(slug);
  return { title: role ? `${role.title} · DropResume` : "DropResume" };
}

export default async function ApplyPage({ params }: PageProps<"/j/[slug]">) {
  const { slug } = await params;
  const role = await getPublicRole(slug);
  if (!role) notFound();

  return (
    <>
      <SiteHeader variant="brand" brandHref={`/j/${slug}`} />
      <CenteredCardLayout>
        {role.isOpen ? (
          <>
            <StatusBadge status="active" className="mb-3" />
            <h1 className="font-heading text-[1.375rem] font-bold tracking-[-0.04em] sm:text-2xl">
              {role.title}
            </h1>
            <p className="mt-1.5 mb-4 text-muted-foreground">
              {role.companyName
                ? `${role.companyName} · Attach your resume to apply. No account needed.`
                : "Attach your resume to apply. No account needed."}
            </p>
            <ApplyFormClient slug={slug} />
          </>
        ) : (
          <ResultCard
            tone="neutral"
            icon={<Lock />}
            title="This role is no longer accepting submissions"
          >
            {role.title} has been closed. If you already applied, your resume is
            still with the hiring team.
          </ResultCard>
        )}
      </CenteredCardLayout>
    </>
  );
}
