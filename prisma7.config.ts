import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not read `.env*` itself. Loading them the way Next.js does
// keeps the CLI and the app on one env file, `.env.local`.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI only - migrate, db pull, studio. Supabase's transaction pooler cannot
    // run DDL, so this is the direct port-5432 connection. The app connects over
    // DATABASE_URL (the pooler) through the pg adapter in src/lib/data/prisma/client.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    // `migrate dev` needs a scratch database it can create and drop. Supabase does
    // not allow that on a hosted project, so point this at a throwaway local
    // Postgres when writing migrations.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
