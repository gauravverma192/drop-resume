import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { z } from "zod";

import { sendMagicLink, signInWithGoogle } from "@/app/actions/auth";
import { CenteredCardLayout } from "@/components/chrome/centered-card-layout";
import { SiteHeader } from "@/components/chrome/site-header";
import { ResultCard } from "@/components/feedback/result-card";
import { LoginForm } from "@/components/forms/login-form";
import { getSession, loginPath, safeInternalPath } from "@/lib/auth/session";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeInternalPath(typeof params.next === "string" ? params.next : undefined);
  const user = await getSession();
  if (user) {
    redirect(next ?? "/");
  }

  const error = typeof params.error === "string" ? params.error : undefined;
  // `?sent=` is reflected back to the page, so only show it if it is an address.
  const sent = z.email().safeParse(params.sent).data;

  return (
    <>
      <SiteHeader variant="brand" />
      <CenteredCardLayout>
        {sent ? (
          <ResultCard tone="neutral" icon={<Mail />} title="Check your email">
            A sign-in link is on its way to <strong>{sent}</strong>. It works
            once.{" "}
            <Link
              href={loginPath({ next })}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Use a different email
            </Link>
          </ResultCard>
        ) : (
          <LoginForm
            action={sendMagicLink}
            googleAction={signInWithGoogle}
            next={next}
            error={error}
          />
        )}
      </CenteredCardLayout>
    </>
  );
}
