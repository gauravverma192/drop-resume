import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { CenteredCardLayout } from "@/components/chrome/centered-card-layout";
import { SiteHeader } from "@/components/chrome/site-header";
import { ResultCard } from "@/components/feedback/result-card";
import { getPublicRole } from "@/lib/data";

export async function generateMetadata({
  params,
}: PageProps<"/j/[slug]/thanks">) {
  const { slug } = await params;
  const role = await getPublicRole(slug);
  return { title: role ? `Application received · ${role.title}` : "DropResume" };
}

export default async function ThanksPage({
  params,
}: PageProps<"/j/[slug]/thanks">) {
  const { slug } = await params;
  const role = await getPublicRole(slug);
  if (!role) notFound();

  return (
    <>
      <SiteHeader variant="brand" brandHref={`/j/${slug}`} />
      <CenteredCardLayout>
        <ResultCard tone="success" icon={<Check />} title="Application received">
          Your resume for <strong>{role.title}</strong> is in. You can close this
          tab.
        </ResultCard>
      </CenteredCardLayout>
    </>
  );
}
