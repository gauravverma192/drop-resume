# DropResume

Collect resumes through one shareable link instead of your inbox.

A hiring person creates a **role** - a named bucket for one hiring intent, like
"Senior Backend Engineer" or "Hiring fullstack engineers" - and gets a public URL such
as `/j/hiring-fullstack-engineers-x7k2m9`. They can add an optional company name and
description. They post that link on LinkedIn. Every candidate who opens it fills in
their name, email, and phone, attaches a resume, and submits. No account, no
back-and-forth.

Each submission is stored with its original file and then read once by Gemini Flash,
which extracts the current title, company, years of experience, primary strength
(backend, frontend, fullstack, data, …), location, skills, and education, writes a
two-line summary, and - when the role has a description - assigns a 0-100 match score.
The recruiter gets one table they can sort, filter, search, flag as shortlisted or
rejected, and export to CSV.

## Status

Under construction. The scaffold is in place; auth, the database, the public form, and
the dashboard table are being built in order. See
[.cursor/rules/001-project-mvp.md](.cursor/rules/001-project-mvp.md) for the full plan
and the build order.

## Stack

| Concern         | Choice                                                   |
| --------------- | -------------------------------------------------------- |
| Framework       | Next.js 16 App Router, TypeScript                        |
| UI              | Tailwind CSS v4 + shadcn/ui                              |
| Database        | Supabase Postgres via Prisma                             |
| Files           | Supabase Storage, private bucket, signed URLs            |
| Auth            | Supabase Auth - Google OAuth + email magic link          |
| AI              | Gemini Flash via `@google/genai`, structured output       |
| Abuse           | Cloudflare Turnstile + per-IP rate limit counted in Postgres |
| Hosting         | Vercel                                                   |

## Running it

Requires Node `>=20.19.0` - Prisma 7's floor, which is higher than Next.js 16's. There
is an `.nvmrc`, so `nvm use` picks the right one.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Connecting a Supabase project

Anything that persists needs a real project, created once from the
[Supabase dashboard](https://supabase.com/dashboard):

1. Create the project, then copy the API URL and keys from **Project Settings → API**
   and both connection strings from **Project Settings → Database** into `.env.local`.
2. `npm run db:deploy` - applies [prisma/migrations](prisma/migrations) over
   `DIRECT_URL`. The port-6543 pooler cannot run DDL, which is why migrations use a
   separate connection string from the app.
3. `npm run setup:storage` - creates the private `resumes` bucket and fails loudly if
   the bucket turns out to be public.

`npm run db:migrate` is for authoring a _new_ migration and additionally needs
`SHADOW_DATABASE_URL`; see the note in [.env.example](.env.example).

### Running without cloud credentials

The app is deliberately runnable before any account exists. Two escape hatches keep it
that way:

- **Turnstile** is bypassed when `TURNSTILE_SECRET_KEY` is unset, so the public form
  submits without a bot check.
- **Resume parsing** returns fixed placeholder fields when `GEMINI_API_KEY` is unset,
  so submissions still move from `PENDING` to `DONE`.

Anything that touches the database or file storage needs a real Supabase project, so
fill in `DATABASE_URL`, `DIRECT_URL`, and the Supabase keys before you expect a
submission to persist. Every variable and where to find it is documented in
[.env.example](.env.example).

Until then the dashboard reads from an in-memory store seeded with sample roles, so the
UI is browsable but nothing survives a restart.

## Scripts

| Command                 | Does                                              |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Dev server on port 3000                           |
| `npm run build`         | Production build                                  |
| `npm start`             | Serve the production build                        |
| `npm run lint`          | ESLint                                            |
| `npm run typecheck`     | `tsc --noEmit`                                    |
| `npm run db:deploy`     | Apply existing migrations over `DIRECT_URL`       |
| `npm run db:migrate`    | Author a new migration from schema changes        |
| `npm run db:studio`     | Prisma Studio                                     |
| `npm run setup:storage` | Create the private `resumes` bucket               |

## Layout

```
prisma/
  schema.prisma   Role, Submission, SubmitAttempt
  migrations/     checked in; applied with npm run db:deploy
src/
  app/            routes - dashboard at /, /login, /roles/*, /j/[slug], /api/*
  components/ui/  shadcn/ui components
  generated/      Prisma client, gitignored, rebuilt on npm install
  lib/            shared helpers
```

Connection strings live in [prisma7.config.ts](prisma7.config.ts) rather than in
`schema.prisma`; Prisma 7 moved them there and dropped the schema's `directUrl`.

## Things worth knowing

- **Resumes must be PDF, JPG, or PNG, max 2 MB.** DOC and DOCX are rejected with a
  message asking for a PDF - Gemini reads PDFs and images directly, and adding a
  text-extraction path for one file type is not worth it.
- **One submission per email per role.** A repeat email gets a clear rejection rather
  than a second row.
- **Closing a role is a reversible pause.** It stops new submissions and deletes
  nothing. Files are removed only when the role itself is deleted.
- **Recruiters never get a public file URL**, only short-lived signed ones; the storage
  bucket is private.
- **Raw IPs are never stored.** The rate limiter keys on `sha256(ip + APP_SALT)`.
