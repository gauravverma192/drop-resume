import { DataError } from "@/lib/data/errors";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 8000;

type SiteVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

/**
 * Server-side Turnstile check. Skipped when `TURNSTILE_SECRET_KEY` is unset so
 * `npm run dev` works before a Cloudflare account exists. Fail closed on a
 * missing token, a Cloudflare error, or a network timeout.
 */
async function verifyTurnstile(token: string | undefined, ip: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return;

  const responseToken = token?.trim();
  if (!responseToken) throw new DataError("TURNSTILE_FAILED");

  const body = new URLSearchParams({
    secret,
    response: responseToken,
    remoteip: ip,
  });

  let payload: SiteVerifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new DataError("TURNSTILE_FAILED");
    }
    payload = (await response.json()) as SiteVerifyResponse;
  } catch (error) {
    if (error instanceof DataError) throw error;
    throw new DataError("TURNSTILE_FAILED");
  }

  if (!payload.success) {
    console.error("Turnstile siteverify failed", payload["error-codes"] ?? []);
    throw new DataError("TURNSTILE_FAILED");
  }
}

export { verifyTurnstile };
