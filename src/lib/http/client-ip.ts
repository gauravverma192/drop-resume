import { headers } from "next/headers";

/**
 * Left-most `x-forwarded-for` hop is the client on Vercel. Missing headers
 * (local `next dev`) fall back to loopback so the rate limiter still has a
 * stable key and the raw address is never stored.
 */
async function requestClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const direct =
    headerStore.get("x-real-ip")?.trim() ||
    headerStore.get("cf-connecting-ip")?.trim() ||
    headerStore.get("x-vercel-forwarded-for")?.trim();
  return direct || "127.0.0.1";
}

export { requestClientIp };
