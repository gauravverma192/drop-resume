// Creates the private `resumes` bucket in Supabase Storage. Idempotent, so it is
// safe to re-run against an existing project: `npm run setup:storage`.
//
// Plain .mjs rather than TypeScript so it runs on bare node with no build step.
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), true);

const BUCKET = "resumes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."
  );
  process.exit(1);
}

const headers = {
  apikey: serviceRoleKey,
  authorization: `Bearer ${serviceRoleKey}`,
  "content-type": "application/json",
};

const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
  method: "POST",
  headers,
  body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
});

if (createResponse.ok) {
  console.log(`Created private bucket "${BUCKET}".`);
} else {
  const body = await createResponse.text();
  // Storage answers 409 when the bucket is already there, which is a success here.
  if (createResponse.status !== 409) {
    console.error(`Could not create the bucket: ${createResponse.status} ${body}`);
    process.exit(1);
  }
  console.log(`Bucket "${BUCKET}" already exists.`);
}

// Trust the API, not the request: re-read the bucket and fail loudly if it is public.
const getResponse = await fetch(`${supabaseUrl}/storage/v1/bucket/${BUCKET}`, {
  headers,
});

if (!getResponse.ok) {
  console.error(
    `Created the bucket but could not read it back: ${getResponse.status} ${await getResponse.text()}`
  );
  process.exit(1);
}

const bucket = await getResponse.json();

if (bucket.public !== false) {
  console.error(
    `Bucket "${BUCKET}" is public. Resumes must never be reachable without a signed URL - set it to private in the dashboard.`
  );
  process.exit(1);
}

console.log(`Bucket "${BUCKET}" is private. Storage is ready.`);
