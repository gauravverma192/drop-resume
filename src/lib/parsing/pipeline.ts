import type { ResumeFields } from "./schema";
import type { Pipeline } from "./types";

const PIPELINES = [
  "docling-nvidia",
  "gemini-direct",
  "docling-gemini",
] as const satisfies readonly Pipeline[];

const DEFAULT_PIPELINE: Pipeline = "docling-nvidia";

const REQUIRED_KEYS: Record<Pipeline, readonly string[]> = {
  "docling-nvidia": ["DOCLING_URL", "DOCLING_API_KEY", "NVIDIA_API_KEY"],
  "docling-gemini": ["DOCLING_URL", "DOCLING_API_KEY", "GEMINI_API_KEY"],
  "gemini-direct": ["GEMINI_API_KEY"],
};

/**
 * Fixed fields returned when the selected pipeline's keys are absent, so
 * `npm run dev` stays runnable without cloud credentials. Identity fields stay
 * null because nothing was actually parsed.
 */
const PLACEHOLDER_FIELDS: ResumeFields = {
  name: null,
  email: null,
  phone: null,
  currentTitle: "Software Engineer",
  currentCompany: "Unknown",
  companies: [],
  yearsExperience: 3,
  highlySkilledAt: "Fullstack",
  location: null,
  skills: ["JavaScript"],
  education: [],
  aiSummary:
    "Placeholder fields until resume parsing credentials are configured.",
};

type ResolvedPipeline = {
  pipeline: Pipeline;
  ready: boolean;
};

function hasEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

function isPipeline(value: string): value is Pipeline {
  return (PIPELINES as readonly string[]).includes(value);
}

function selectedPipeline(override?: Pipeline): Pipeline {
  if (override) return override;
  const raw = process.env.RESUME_PARSER?.trim();
  if (raw && isPipeline(raw)) return raw;
  return DEFAULT_PIPELINE;
}

function pipelineKeysPresent(pipeline: Pipeline) {
  return REQUIRED_KEYS[pipeline].every(hasEnv);
}

/**
 * Picks the named pipeline from `RESUME_PARSER` (default `docling-nvidia`).
 * `ready` is false when that pipeline's keys are missing; the caller should
 * return `PLACEHOLDER_FIELDS` instead of calling the model.
 */
function resolvePipeline(override?: Pipeline): ResolvedPipeline {
  const pipeline = selectedPipeline(override);
  return { pipeline, ready: pipelineKeysPresent(pipeline) };
}

export {
  DEFAULT_PIPELINE,
  PIPELINES,
  PLACEHOLDER_FIELDS,
  pipelineKeysPresent,
  resolvePipeline,
  type ResolvedPipeline,
};
