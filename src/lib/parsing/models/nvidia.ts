import { buildPrompt } from "@/lib/parsing/prompt";
import { buildResumeSchema, toJsonSchema } from "@/lib/parsing/schema";
import type { ModelParseResult, TokenUsage } from "@/lib/parsing/types";

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

type ParseWithNvidiaInput = {
  documentJson: string;
  roleDescription: string | null;
  model?: string;
};

type NvidiaUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  reasoning_tokens?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
};

type NvidiaPayload = {
  error?: string | { message?: string };
  detail?: string;
  message?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null };
  }>;
  usage?: NvidiaUsage;
};

type NvidiaResponseFormat =
  | {
      type: "json_schema";
      json_schema: { name: string; schema: Record<string, unknown> };
    }
  | { type: "json_object" };

type NvidiaChatBody = {
  model: string;
  messages: Array<{ role: "user"; content: string }>;
  temperature: number;
  max_tokens: number;
  stream: false;
  reasoning_effort: string;
  response_format: NvidiaResponseFormat;
  nvext?: { guided_json: Record<string, unknown> };
};

function resolveModel(override?: string) {
  if (override?.trim()) return override.trim();
  return process.env.NVIDIA_MODEL?.trim() || DEFAULT_MODEL;
}

function getApiKey() {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set.");
  return apiKey;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function nvidiaErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as NvidiaPayload;
  if (typeof body.error === "string") return body.error;
  if (typeof body.error === "object" && typeof body.error.message === "string") {
    return body.error.message;
  }
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.message === "string") return body.message;
  return fallback;
}

function isFormatRejected(status: number, payload: unknown) {
  if (status === 401 || status === 403) return false;
  const message = nvidiaErrorMessage(payload, "").toLowerCase();
  return (
    status === 400 ||
    /response_format|json_schema|guided_json|unrecognized|unknown field|invalid/.test(
      message
    )
  );
}

async function nvidiaChat({
  apiKey,
  body,
}: {
  apiKey: string;
  body: NvidiaChatBody;
}) {
  const response = await fetch(NVIDIA_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as NvidiaPayload | null;
  return { response, payload };
}

function mapFinishReason(reason: string | null | undefined) {
  if (!reason) return null;
  if (reason === "stop") return "STOP";
  if (reason === "length") return "MAX_TOKENS";
  return reason.toUpperCase();
}

function mapUsage(usage: NvidiaUsage = {}): TokenUsage {
  const input = usage.prompt_tokens ?? 0;
  const completion = usage.completion_tokens ?? 0;
  const thoughts =
    usage.completion_tokens_details?.reasoning_tokens ??
    usage.reasoning_tokens ??
    0;
  const output = Math.max(0, completion - thoughts);
  return {
    input,
    output,
    thoughts,
    total: usage.total_tokens ?? input + completion,
  };
}

/**
 * gpt-oss may wrap JSON in a fence even when asked for an object. Pull the
 * first parseable object out so a valid payload is not lost to decoration.
 */
function extractJsonText(text: string | null | undefined) {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) return candidate;
    return candidate.slice(start, end + 1);
  }
}

function compactJson(documentJson: string) {
  try {
    return { ok: true as const, text: JSON.stringify(JSON.parse(documentJson)) };
  } catch (error) {
    return { ok: false as const, message: errorMessage(error, "Invalid JSON") };
  }
}

/**
 * JSON resume in, structured object out. The only accepted input is Docling
 * JSON, compacted and inlined into the prompt — NVIDIA does not take a file
 * attachment.
 *
 * Never throws. Hosted NIM rejects `json_schema` on some models, so the call
 * walks a three-attempt `response_format` fallback: json_schema, then
 * json_object plus `nvext.guided_json`, then unconstrained json_object.
 */
async function parseWithNvidia(
  input: ParseWithNvidiaInput
): Promise<ModelParseResult> {
  const result: ModelParseResult = {
    ok: false,
    data: null,
    usage: null,
    latencyMs: 0,
    error: null,
  };

  const compacted = compactJson(input.documentJson);
  if (!compacted.ok) {
    result.error = {
      stage: "json",
      message: `Docling JSON does not parse: ${compacted.message}`,
    };
    return result;
  }

  const zodSchema = buildResumeSchema({
    withMatchScore: Boolean(input.roleDescription),
  });
  const jsonSchema = toJsonSchema(zodSchema);

  const startedAt = Date.now();
  let payload: NvidiaPayload | null = null;
  try {
    const apiKey = getApiKey();
    const baseBody = {
      model: resolveModel(input.model),
      messages: [
        {
          role: "user" as const,
          content: buildPrompt(input.roleDescription, {
            documentJson: compacted.text,
          }),
        },
      ],
      temperature: 0,
      max_tokens: 4096,
      stream: false as const,
      reasoning_effort: "low",
    };

    const attempts: NvidiaChatBody[] = [
      {
        ...baseBody,
        response_format: {
          type: "json_schema",
          json_schema: { name: "resume_extraction", schema: jsonSchema },
        },
      },
      {
        ...baseBody,
        response_format: { type: "json_object" },
        nvext: { guided_json: jsonSchema },
      },
      { ...baseBody, response_format: { type: "json_object" } },
    ];

    for (const [index, body] of attempts.entries()) {
      const { response, payload: nextPayload } = await nvidiaChat({
        apiKey,
        body,
      });
      payload = nextPayload;
      if (response.ok) break;
      const message = nvidiaErrorMessage(
        payload,
        `NVIDIA API ${response.status} ${response.statusText}`
      );
      const canRetry =
        index < attempts.length - 1 &&
        isFormatRejected(response.status, payload);
      if (!canRetry) {
        result.latencyMs = Date.now() - startedAt;
        result.error = { stage: "api", message };
        return result;
      }
    }
  } catch (error) {
    result.latencyMs = Date.now() - startedAt;
    result.error = { stage: "api", message: errorMessage(error, "NVIDIA request failed.") };
    return result;
  }
  result.latencyMs = Date.now() - startedAt;

  const choice = payload?.choices?.[0] ?? {};
  result.usage = mapUsage(payload?.usage ?? {});
  const finishReason = mapFinishReason(choice.finish_reason);
  const text = extractJsonText(choice.message?.content ?? null);

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

export { DEFAULT_MODEL, NVIDIA_CHAT_URL, parseWithNvidia, type ParseWithNvidiaInput };
