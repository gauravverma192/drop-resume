import { redirect } from "next/navigation";

import { sendMagicLink } from "@/app/actions/auth";
import { CenteredCardLayout } from "@/components/chrome/centered-card-layout";
import { SiteHeader } from "@/components/chrome/site-header";
import { LoginForm } from "@/components/forms/login-form";
import { getSession, safeInternalPath } from "@/lib/auth/session";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeInternalPath(typeof params.next === "string" ? params.next : undefined);
  const user = await getSession();
  if (user) {
    redirect(next ?? "/");
  }

  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <>
      <SiteHeader variant="brand" />
      <CenteredCardLayout>
        <LoginForm action={sendMagicLink} next={next} error={error} />
      </CenteredCardLayout>
    </>
  );
}
