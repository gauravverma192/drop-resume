const RULES = `Rules:
- Extract only what the document states. Never infer an employer, a degree or a
  contact detail that is not written down.
- If a field is genuinely absent, return null. A null is a correct answer; a
  plausible guess is not.
- Copy names, emails and phone numbers character for character, including any
  unusual capitalisation.
- List every employer in the work history under companies, most recent first,
  including the current one. One entry per employer. If the same employer
  appears twice with different titles, keep both entries. Do not list schools,
  clients named inside a bullet point, or personal projects.
- If the document is not a resume at all, return null for every field and an
  empty array for the list fields.`;

const BASE_FILE = `You are parsing a single candidate's resume. The document is attached.

${RULES}
- The attachment may be a photo or a scan. Read what is legible and return null
  for what is not.`;

const BASE_JSON = `You are parsing a single candidate's resume. The document is provided as
structured JSON in this prompt (layout-parsed texts, tables, groups, body).
Treat that JSON as the resume. Ignore parser ids and metadata that are not
written content.

${RULES}
- The JSON may be incomplete or noisy. Read what is present and return null
  for what is not.`;

const SCORING = `
Then score this candidate against the role description below.

Scoring rules:
- Judge only against what the description asks for. Ignore general prestige.
- Weigh demonstrated depth over keyword presence: someone who shipped and
  operated one relevant system beats someone who lists ten technologies.
- Write matchScoreReason first and let it drive matchScore, not the reverse.
  The reason must cite specific evidence from the resume.
- Use the whole range. 0-30 is a clear mismatch, 40-60 is partial, 70-85 is a
  strong fit, 90+ means the resume evidences essentially everything asked for.

--- ROLE DESCRIPTION ---
`;

function buildPrompt(
  roleDescription: string | null,
  { documentJson = null }: { documentJson?: string | null } = {}
) {
  const base = documentJson
    ? `${BASE_JSON}\n\n--- RESUME ---\n${documentJson}\n--- END RESUME ---`
    : BASE_FILE;
  if (!roleDescription) return base;
  return `${base}\n${SCORING}${roleDescription.trim()}\n--- END ROLE DESCRIPTION ---`;
}

export { buildPrompt };
