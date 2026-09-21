const BASE_MAX_LENGTH = 48;
const SUFFIX_LENGTH = 6;
/** 32 characters, so a byte maps onto one without modulo bias, and no 0/o or 1/l. */
const SUFFIX_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

function slugSuffix() {
  const bytes = crypto.getRandomValues(new Uint8Array(SUFFIX_LENGTH));
  let suffix = "";
  for (const byte of bytes) {
    suffix += SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length];
  }
  return suffix;
}

function slugBase(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, BASE_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
  // A title made entirely of punctuation or non-Latin script leaves nothing.
  return base || "role";
}

/**
 * The random suffix is what keeps a public link from being guessable: without
 * it, "senior-backend-engineer" would be the same URL at every company using
 * DropResume, and role links could be enumerated.
 */
function roleSlug(title: string) {
  return `${slugBase(title)}-${slugSuffix()}`;
}

export { roleSlug };
