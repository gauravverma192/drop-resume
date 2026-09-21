import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  __dropResumePrisma?: PrismaClient;
};

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the Supabase connection strings."
    );
  }

  // One socket per instance: the Supabase transaction pooler already multiplexes,
  // and a frozen serverless function cannot use a second idle connection.
  const adapter = new PrismaPg({ connectionString, max: 1 });
  return new PrismaClient({ adapter });
}

/**
 * Built on first use rather than at import time, so a missing `DATABASE_URL`
 * surfaces as a readable error from the query that needed it instead of
 * breaking any module that happens to import this one. Cached on `globalThis`
 * so `next dev` hot reloads reuse one pool.
 */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.__dropResumePrisma) {
    globalForPrisma.__dropResumePrisma = createPrisma();
  }
  return globalForPrisma.__dropResumePrisma;
}

export { getPrisma };
