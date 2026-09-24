import type { ResumeFields } from "./schema";

type Pipeline = "docling-nvidia" | "gemini-direct" | "docling-gemini";

type TokenUsage = {
  input: number;
  output: number;
  thoughts: number;
  total: number;
};

type ParseError = {
  stage: string;
  message: string;
};

type ParseInput = {
  bytes: Uint8Array;
  fileName: string;
  roleDescription: string | null;
  pipeline?: Pipeline;
};

type ParseResult = {
  ok: boolean;
  data: ResumeFields | null;
  rawText: string | null;
  usage: TokenUsage | null;
  latencyMs: number;
  error: ParseError | null;
};

/** Model adapters do not own `rawText`; Docling pipelines fill that in later. */
type ModelParseResult = Omit<ParseResult, "rawText">;

export type {
  ModelParseResult,
  ParseError,
  ParseInput,
  ParseResult,
  Pipeline,
  ResumeFields,
  TokenUsage,
};
