---
name: DropResume Plan
overview: "A Next.js app where a recruiter creates a named link for a role, shares it, and every resume submitted through it lands in one filterable list with Gemini-extracted fields. Full plan in ./001-project-mvp.md."
todos:
  - id: scaffold
    content: "Scaffold Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui, write README"
    status: pending
  - id: database
    content: "Create Supabase project, add Prisma schema (Role, Submission, SubmitAttempt) and first migration"
    status: pending
  - id: auth
    content: "Wire Supabase Auth with Google and magic link, /auth/callback, requireUser() helper"
    status: pending
  - id: roles-crud
    content: Roles create/list/rename/close/delete with slug generation and copy-link UI
    status: pending
  - id: public-form
    content: "Public /j/[slug] form: validation, closed state, duplicate rejection, Storage upload"
    status: pending
  - id: parsing
    content: "Gemini parseResume() behind after(), processing/failed states, retry"
    status: pending
  - id: dashboard-table
    content: "Candidate table: columns, sorting, filtering, search, status flags, signed-URL file access"
    status: pending
  - id: csv-export
    content: CSV export sharing buildSubmissionWhere with the table
    status: pending
  - id: hardening
    content: "Turnstile, Postgres rate limit, magic-byte sniffing, size limits, cascade storage deletion"
    status: pending
  - id: polish-deploy
    content: "Empty/loading/error states, mobile layout, real copy, Vercel deploy"
    status: pending
isProject: false
---

# DropResume - Build Plan

The full plan is written to `./001-project-mvp.md`.

## Locked decisions

- Name is **DropResume**. The entity is a **Role** everywhere: the UI says "role", the
  Prisma model is `Role`.
- Next.js 16 App Router + TypeScript on Vercel, Tailwind v4 + shadcn/ui, npm.
- Supabase Postgres + Supabase Storage (private bucket, signed URLs).
- Prisma, pinned to `7.10.0`.
- Supabase Auth: Google + email magic link.
- Gemini Flash via `@google/genai`: parse + two-line summary + highlySkilledAt + 0-100
  score (with a tooltip justification) when a role description exists.
- Role create fields: title (required), company name (optional), description (optional).
- Background parse via `after()` from `next/server`.
- Candidate form: name and email required, phone optional, plus the file.
- Accepted files: **PDF only.** DOC and DOCX are rejected with a message
  telling the candidate to export a PDF, which keeps exactly one parse path.
- 2 MB cap, well under Vercel's 4.5 MB request body limit.
- Cloudflare Turnstile plus a per-IP rate limit counted in a Postgres `SubmitAttempt`
  table keyed by a salted IP hash. No Upstash account.
- Resume files are deleted **only when a role is deleted**. Closing a role stops new
  submissions and touches nothing else. No time-based expiry.
- Status flags only: pending / shortlisted / rejected.
- CSV export, duplicate-email rejection, close toggle.
- No email notifications.
- Public URLs like `/j/hiring-fullstack-engineers-x7k2m9`.

## Routing

`/` **is** the dashboard - no marketing page, no `/dashboard` prefix. A signed-out
visitor gets the real dashboard chrome, an empty state with a one-line pitch, and a
"New role" button pointing at `/login?next=/roles/new` so the intent survives sign-in.
The rest of the tree is `/login`, `/auth/callback`, `/roles/new`, `/roles/[id]`,
`/j/[slug]`, and `/j/[slug]/thanks`.

## Two consequences of Prisma over the Supabase client

- Supabase Row Level Security is bypassed, so authorization lives in app code. One
  `requireUser()` helper plus scoped query wrappers filter every recruiter query by the
  signed-in user id.
- Prisma on serverless needs `DATABASE_URL` (Supabase pooler, port 6543) for queries and
  `DIRECT_URL` (port 5432) for migrations.

## Data model

Three tables. `Role` holds ownerId, title, optional companyName, slug, optional
description, isOpen. `Submission` holds the typed fields, the storage path, a review
status, a parse status, and the Gemini output including `rawText`, `highlySkilledAt`,
and `matchScoreReason` so re-scoring never costs a second API call;
`@@unique([roleId, candidateEmail])` is what enforces duplicate rejection correctly
under concurrent submissions. `SubmitAttempt` holds a salted IP hash and a timestamp for
rate limiting.

## Submission flow

Verify Turnstile, rate limit, validate the file, generate the submission id with `cuid2`,
upload to `resumes/{roleId}/{id}.{ext}`, insert the row, redirect the candidate, then
parse in `after()`. The id is generated in application code because the storage path
needs it before the row exists, and a `P2002` duplicate violation deletes the
just-uploaded object so no orphan files are left behind. The candidate never waits on
Gemini. A failed parse marks the row FAILED with a retry button; the file and row are
already safe because they are written before any AI call.

## Build order

Steps 1-5 already give a working product (a link that collects resumes into a list);
everything after that increases the value of the list.
