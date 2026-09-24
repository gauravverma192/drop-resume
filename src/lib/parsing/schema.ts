import { z } from "zod";

// Mirrors the AI-written columns on Submission in prisma/schema.prisma so the
// parse job can write model output without a second mapping layer.
//
// Every extracted field is nullable rather than optional. Structured output
// always emits the full key set, and an explicit null means "the model looked
// and found nothing", which is a different signal from a missing key.

const SKILL_AREAS = [
  "Backend",
  "Frontend",
  "Fullstack",
  "Mobile",
  "Data",
  "ML",
  "DevOps",
  "QA",
  "Security",
  "Design",
  "Product",
  "Other",
] as const;

type SkillArea = (typeof SKILL_AREAS)[number];

const educationEntry = z.object({
  institution: z.string().nullable(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  endYear: z
    .string()
    .nullable()
    .describe("Graduation year as it appears, or null."),
});

const companyEntry = z.object({
  company: z.string().describe("Employer name as written."),
  title: z
    .string()
    .nullable()
    .describe("Job title held there, or null if not stated."),
  startDate: z
    .string()
    .nullable()
    .describe(
      "Start date as it appears, e.g. 'Mar 2021' or '2021'. Null if absent."
    ),
  endDate: z
    .string()
    .nullable()
    .describe(
      "End date as it appears, or 'Present' if this is the current role. Null if absent."
    ),
});

type EducationEntry = z.infer<typeof educationEntry>;
type CompanyEntry = z.infer<typeof companyEntry>;

const resumeFieldShape = {
  name: z.string().nullable().describe("Candidate's full name."),
  email: z.string().nullable().describe("Primary email address, verbatim."),
  phone: z
    .string()
    .nullable()
    .describe(
      "Primary phone number, verbatim, including country code if present."
    ),
  currentTitle: z
    .string()
    .nullable()
    .describe("Job title of the most recent role."),
  currentCompany: z
    .string()
    .nullable()
    .describe("Employer of the most recent role."),
  companies: z
    .array(companyEntry)
    .describe(
      "Every employer in the work history, most recent first, including the current one. Employers only - no schools, no side projects. Empty array if none found."
    ),
  yearsExperience: z
    .number()
    .nullable()
    .describe(
      "Total years of professional experience as a decimal, e.g. 6.5. Sum actual employment, excluding internships and education. Null if it cannot be worked out."
    ),
  highlySkilledAt: z
    .enum(SKILL_AREAS)
    .nullable()
    .describe(
      "The single area this candidate is strongest in, based on where they spent the most time."
    ),
  location: z
    .string()
    .nullable()
    .describe("City and country, or whatever granularity is stated."),
  skills: z
    .array(z.string())
    .describe(
      "Concrete technologies, languages and tools. No soft skills. Empty array if none found."
    ),
  education: z.array(educationEntry).describe("Empty array if none found."),
  aiSummary: z
    .string()
    .nullable()
    .describe(
      "Two sentences on who this candidate is and what they are strongest at. No preamble."
    ),
};

const matchScoreShape = {
  matchScoreReason: z
    .string()
    .nullable()
    .describe(
      "One sentence justifying the score, naming the specific evidence that drove it."
    ),
  matchScore: z
    .int()
    .min(0)
    .max(100)
    .nullable()
    .describe("Fit against the role description, 0-100."),
};

/**
 * Builds the response schema. `withMatchScore` is the one dimension that
 * varies: the app only scores when the role has a description.
 *
 * Key order is deliberate. Models emit keys in schema order, so the cheap
 * identity fields land first and the score is preceded by its own
 * justification, so the reasoning is written before the number it explains.
 */
function buildResumeSchema(
  { withMatchScore = false }: { withMatchScore?: boolean } = {}
) {
  if (withMatchScore) {
    return z.object({ ...resumeFieldShape, ...matchScoreShape });
  }
  return z.object(resumeFieldShape);
}

type ResumeFields = z.infer<ReturnType<typeof buildResumeSchema>>;

/**
 * NVIDIA and Gemini both accept this JSON Schema shape. The `$schema` dialect
 * marker is stripped because Gemini rejects it.
 */
function toJsonSchema(schema: z.ZodType) {
  const jsonSchema = z.toJSONSchema(schema, { io: "output" }) as {
    $schema?: string;
    [key: string]: unknown;
  };
  delete jsonSchema.$schema;
  return jsonSchema;
}

export {
  buildResumeSchema,
  SKILL_AREAS,
  toJsonSchema,
  type CompanyEntry,
  type EducationEntry,
  type ResumeFields,
  type SkillArea,
};
