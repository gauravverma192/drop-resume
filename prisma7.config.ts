import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not read `.env*` itself. Loading them the way Next.js does
// keeps the CLI and the app on one env file, `.env.local`.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL || undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI only - migrate, db pull, studio. The app connects over DATABASE_URL
    // (transaction pooler, port 6543) through the pg adapter in
    // src/lib/data/prisma/client.ts. DIRECT_URL should be a session-mode or
    // direct connection on port 5432; an empty SHADOW_DATABASE_URL is ignored
    // because Prisma treats "" as invalid.
    url: directUrl,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
