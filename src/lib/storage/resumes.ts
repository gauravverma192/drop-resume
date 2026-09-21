const RESUMES_BUCKET = "resumes";
const STORAGE_PREFIX = `${RESUMES_BUCKET}/`;

type StorageEnv = {
  url: string;
  headers: {
    apikey: string;
    authorization: string;
  };
};

function storageEnv(): StorageEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Copy .env.example to .env.local and fill in the Supabase keys."
    );
  }
  return {
    url: url.replace(/\/$/, ""),
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  };
}

function objectPathFromStoragePath(storagePath: string) {
  if (!storagePath.startsWith(STORAGE_PREFIX)) {
    throw new Error(`Unexpected storage path: ${storagePath}`);
  }
  return storagePath.slice(STORAGE_PREFIX.length);
}

function objectUrl(env: StorageEnv, objectPath: string) {
  return `${env.url}/storage/v1/object/${RESUMES_BUCKET}/${objectPath}`;
}

async function uploadResume(
  storagePath: string,
  bytes: Uint8Array,
  mime: string
) {
  const env = storageEnv();
  const objectPath = objectPathFromStoragePath(storagePath);
  const response = await fetch(objectUrl(env, objectPath), {
    method: "POST",
    headers: {
      ...env.headers,
      "content-type": mime,
      "x-upsert": "false",
    },
    body: Buffer.from(bytes),
  });

  if (!response.ok) {
    throw new Error(
      `Could not store the resume: ${response.status} ${await response.text()}`
    );
  }
}

/**
 * Best-effort cleanup after a failed insert. A delete error is logged rather
 * than thrown so the original failure (usually a duplicate email) still wins.
 */
async function deleteResume(storagePath: string) {
  const env = storageEnv();
  const objectPath = objectPathFromStoragePath(storagePath);
  const response = await fetch(objectUrl(env, objectPath), {
    method: "DELETE",
    headers: env.headers,
  });

  if (!response.ok && response.status !== 404) {
    console.error(
      `Could not delete ${storagePath}: ${response.status} ${await response.text()}`
    );
  }
}

export { deleteResume, RESUMES_BUCKET, uploadResume };
