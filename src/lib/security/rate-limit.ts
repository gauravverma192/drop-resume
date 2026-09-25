import { createHash } from "node:crypto";

import { DataError } from "@/lib/data/errors";
import { getPrisma } from "@/lib/data/prisma/client";

/** Public submits allowed from one hashed IP inside the window. */
const SUBMIT_RATE_LIMIT = 10;
/** Rolling window counted in Postgres (and the in-memory fallback). */
const SUBMIT_RATE_WINDOW_MS = 10 * 60 * 1000;
/** Rows older than this are pruned on the same request so the table stays bounded. */
const SUBMIT_ATTEMPT_TTL_MS = 60 * 60 * 1000;

type MemoryAttempt = {
  ipHash: string;
  createdAt: number;
};

const globalForAttempts = globalThis as typeof globalThis & {
  __dropResumeSubmitAttempts?: MemoryAttempt[];
};

function memoryAttempts(): MemoryAttempt[] {
  if (!globalForAttempts.__dropResumeSubmitAttempts) {
    globalForAttempts.__dropResumeSubmitAttempts = [];
  }
  return globalForAttempts.__dropResumeSubmitAttempts;
}

/** `sha256(ip + APP_SALT)`. The raw IP never lands in the database. */
function hashClientIp(ip: string): string {
  const salt = process.env.APP_SALT ?? "";
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}

function usesPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

async function enforcePostgresSubmitRateLimit(ipHash: string) {
  const prisma = getPrisma();
  const now = Date.now();
  const windowStart = new Date(now - SUBMIT_RATE_WINDOW_MS);
  const ttlCutoff = new Date(now - SUBMIT_ATTEMPT_TTL_MS);

  const [, recent] = await Promise.all([
    prisma.submitAttempt.deleteMany({
      where: { createdAt: { lt: ttlCutoff } },
    }),
    prisma.submitAttempt.count({
      where: { ipHash, createdAt: { gte: windowStart } },
    }),
  ]);

  if (recent >= SUBMIT_RATE_LIMIT) {
    throw new DataError("RATE_LIMITED");
  }

  await prisma.submitAttempt.create({ data: { ipHash } });
}

function enforceMemorySubmitRateLimit(ipHash: string) {
  const now = Date.now();
  const attempts = memoryAttempts().filter(
    (attempt) => now - attempt.createdAt < SUBMIT_ATTEMPT_TTL_MS
  );
  globalForAttempts.__dropResumeSubmitAttempts = attempts;

  const recent = attempts.filter(
    (attempt) =>
      attempt.ipHash === ipHash && now - attempt.createdAt < SUBMIT_RATE_WINDOW_MS
  ).length;
  if (recent >= SUBMIT_RATE_LIMIT) {
    throw new DataError("RATE_LIMITED");
  }

  attempts.push({ ipHash, createdAt: now });
}

/**
 * Count-then-insert so this request is not included in the window. A Postgres
 * `SubmitAttempt` row is the source of truth; without `DATABASE_URL` the same
 * window lives in process memory so local mock mode still has a brake.
 */
async function enforceSubmitRateLimit(ip: string): Promise<void> {
  const ipHash = hashClientIp(ip);
  if (usesPostgres()) {
    await enforcePostgresSubmitRateLimit(ipHash);
    return;
  }
  enforceMemorySubmitRateLimit(ipHash);
}

export { enforceSubmitRateLimit };
