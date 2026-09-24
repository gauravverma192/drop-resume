import { GoogleGenAI } from "@google/genai";

import { buildPrompt } from "@/lib/parsing/prompt";
import { buildResumeSchema, toJsonSchema } from "@/lib/parsing/schema";
import type { ModelParseResult } from "@/lib/parsing/types";

const DEFAULT_MODEL = "gemini-3.5-flash";

type ParseWithGeminiInput = {
  roleDescription: string | null;
  model?: string;
} & (
  | { documentJson: string }
  | { bytes: Uint8Array; mimeType?: string }
);

function resolveModel(override?: string) {
  if (override?.trim()) return override.trim();
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function compactJson(documentJson: string) {
  try {
    return { ok: true as const, text: JSON.stringify(JSON.parse(documentJson)) };
  } catch (error) {
    return { ok: false as const, message: errorMessage(error, "Invalid JSON") };
  }
}

let client: GoogleGenAI | undefined;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Structured resume extraction via Gemini. Two input shapes, matching the two
 * pipelines that use this adapter:
 *
 * - `gemini-direct`: attach the PDF (`bytes` + optional `mimeType`).
 * - `docling-gemini`: inline compacted Docling JSON (`documentJson`).
 *
 * Never throws. Uses `responseJsonSchema` (not `responseSchema`) so Zod's
 * JSON Schema, including `anyOf` for nullable fields, is what Gemini sees.
 */
async function parseWithGemini(
  input: ParseWithGeminiInput
): Promise<ModelParseResult> {
  const result: ModelParseResult = {
    ok: false,
    data: null,
    usage: null,
    latencyMs: 0,
    error: null,
  };

  const zodSchema = buildResumeSchema({
    withMatchScore: Boolean(input.roleDescription),
  });

  let contents: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  >;
  if ("documentJson" in input) {
    const compacted = compactJson(input.documentJson);
    if (!compacted.ok) {
      result.error = {
        stage: "json",
        message: `Docling JSON does not parse: ${compacted.message}`,
      };
      return result;
    }
    contents = [
      {
        text: buildPrompt(input.roleDescription, {
          documentJson: compacted.text,
        }),
      },
    ];
  } else {
    contents = [
      { text: buildPrompt(input.roleDescription) },
      {
        inlineData: {
          mimeType: input.mimeType ?? "application/pdf",
          data: Buffer.from(input.bytes).toString("base64"),
        },
      },
    ];
  }

  const startedAt = Date.now();
  let response;
  try {
    response = await getClient().models.generateContent({
      model: resolveModel(input.model),
      contents,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        // responseJsonSchema (not responseSchema) accepts the JSON-Schema-style
        // shape z.toJSONSchema() produces, including anyOf for nullable fields.
        // responseSchema instead expects the SDK's OpenAPI-flavoured Schema type
        // (enum Type, boolean `nullable`), which is a different, narrower shape.
        responseJsonSchema: toJsonSchema(zodSchema),
      },
    });
  } catch (error) {
    result.latencyMs = Date.now() - startedAt;
    result.error = { stage: "api", message: errorMessage(error, "Gemini request failed.") };
    return result;
  }
  result.latencyMs = Date.now() - startedAt;

  const usage = response.usageMetadata ?? {};
  result.usage = {
    input: usage.promptTokenCount ?? 0,
    output: usage.candidatesTokenCount ?? 0,
    thoughts: usage.thoughtsTokenCount ?? 0,
    total: usage.totalTokenCount ?? 0,
  };
  const finishReason = response.candidates?.[0]?.finishReason ?? null;

  let text: string | null = null;
  try {
    text = response.text ?? null;
  } catch (error) {
    result.error = {
      stage: "generate",
      message: errorMessage(error, "Model returned an empty response."),
    };
    return result;
  }

  if (finishReason && finishReason !== "STOP") {
    result.error = {
      stage: "generate",
      message: `Generation stopped with finishReason ${finishReason}, so the JSON is likely incomplete.`,
    };
    return result;
  }

  if (!text) {
    result.error = { stage: "generate", message: "Model returned an empty response." };
    return result;
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    result.error = { stage: "json", message: errorMessage(error, "Invalid JSON") };
    return result;
  }

  const validated = zodSchema.safeParse(json);
  if (!validated.success) {
    result.error = {
      stage: "schema",
      message: validated.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; "),
    };
    return result;
  }

  result.ok = true;
  result.data = validated.data;
  return result;
}

export { DEFAULT_MODEL, parseWithGemini, type ParseWithGeminiInput };
