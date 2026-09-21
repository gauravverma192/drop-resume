import { headers } from "next/headers";

async function appUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function roleShareUrl(origin: string, slug: string) {
  return `${origin}/j/${slug}`;
}

export { appUrl, roleShareUrl };
