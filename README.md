# DropResume

Collect resumes through one shareable link instead of your inbox.

A hiring person creates a **role** - a named bucket for one hiring intent, like
"Senior Backend Engineer" or just "Agoda hiring" - and gets a public URL such as
`/j/agoda-hiring-x7k2m9`. They post that link on LinkedIn. Every candidate who opens it
fills in their name, email, and phone, attaches a resume, and submits. No account, no
back-and-forth.

Each submission is stored with its original file and then read once by Gemini Flash,
which extracts the current title, company, years of experience, location, skills, and
education, writes a two-line summary, and - when the role has a description - assigns a
0-100 match score. The recruiter gets one table they can sort, filter, search, flag as
shortlisted or rejected, and export to CSV.

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

Requires Node `>=20.9.0` (Next.js 16's floor) and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Scripts

| Command             | Does                                        |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Dev server on port 3000                     |
| `npm run build`     | Production build                            |
| `npm start`         | Serve the production build                  |
| `npm run lint`      | ESLint                                      |
| `npm run typecheck` | `tsc --noEmit`                              |

## Layout

```
src/
  app/            routes - dashboard at /, /login, /roles/*, /j/[slug], /api/*
  components/ui/  shadcn/ui components
  lib/            shared helpers
```

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
