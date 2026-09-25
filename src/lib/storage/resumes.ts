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

async function downloadResume(storagePath: string) {
  const env = storageEnv();
  const objectPath = objectPathFromStoragePath(storagePath);
  const response = await fetch(objectUrl(env, objectPath), {
    method: "GET",
    headers: env.headers,
  });

  if (!response.ok) {
    throw new Error(
      `Could not download the resume: ${response.status} ${await response.text()}`
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

const LIST_PAGE_SIZE = 1000;
const DELETE_BATCH_SIZE = 100;

function storageConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Every object under `resumes/{roleId}/`. Names from `/object/list` are either
 * the full key or the filename relative to the prefix, so both shapes are
 * normalised before delete.
 */
async function listRoleObjectPaths(roleId: string): Promise<string[]> {
  const env = storageEnv();
  const prefix = `${roleId}/`;
  const objectPaths = new Set<string>();

  for (let page = 0; page < 50; page += 1) {
    const response = await fetch(`${env.url}/storage/v1/object/list/${RESUMES_BUCKET}`, {
      method: "POST",
      headers: {
        ...env.headers,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prefix,
        limit: LIST_PAGE_SIZE,
        offset: page * LIST_PAGE_SIZE,
        sortBy: { column: "name", order: "asc" },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Could not list resumes for role ${roleId}: ${response.status} ${await response.text()}`
      );
    }

    const items = (await response.json()) as Array<{ name?: string }>;
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      const name = item.name?.trim();
      if (!name || name.endsWith("/")) continue;
      objectPaths.add(name.includes("/") ? name : `${prefix}${name}`);
    }

    if (items.length < LIST_PAGE_SIZE) break;
  }

  return [...objectPaths];
}

async function deleteObjectPaths(roleId: string, objectPaths: string[]) {
  const env = storageEnv();

  for (let i = 0; i < objectPaths.length; i += DELETE_BATCH_SIZE) {
    const batch = objectPaths.slice(i, i + DELETE_BATCH_SIZE);
    const response = await fetch(`${env.url}/storage/v1/object/${RESUMES_BUCKET}`, {
      method: "DELETE",
      headers: {
        ...env.headers,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prefixes: batch }),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Could not delete resumes for role ${roleId}: ${response.status} ${await response.text()}`
      );
    }
  }
}

/**
 * Removes every resume stored for a role. Closing a role must not call this;
 * only a full delete does. Missing storage credentials are a no-op so an
 * empty Postgres-backed role can still be deleted before Storage is wired up.
 */
async function deleteRoleResumes(roleId: string) {
  if (!storageConfigured()) return;

  const objectPaths = await listRoleObjectPaths(roleId);
  if (objectPaths.length === 0) return;
  await deleteObjectPaths(roleId, objectPaths);
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

/**
 * Short-lived URL the recruiter's browser follows. The bucket stays private;
 * only this token (and only for `expiresIn` seconds) can read the object.
 */
async function signResumeUrl(storagePath: string, expiresIn = 60) {
  const env = storageEnv();
  const objectPath = objectPathFromStoragePath(storagePath);
  const response = await fetch(
    `${env.url}/storage/v1/object/sign/${RESUMES_BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        ...env.headers,
        "content-type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Could not sign the resume URL: ${response.status} ${await response.text()}`
    );
  }

  const body = (await response.json()) as {
    signedURL?: string;
    signedUrl?: string;
  };
  const signed = body.signedURL ?? body.signedUrl;
  if (!signed) {
    throw new Error("Could not sign the resume URL: missing signedURL.");
  }
  if (signed.startsWith("http://") || signed.startsWith("https://")) {
    return signed;
  }
  const path = signed.startsWith("/") ? signed : `/${signed}`;
  return `${env.url}/storage/v1${path}`;
}

export {
  deleteResume,
  deleteRoleResumes,
  downloadResume,
  RESUMES_BUCKET,
  signResumeUrl,
  uploadResume,
};
