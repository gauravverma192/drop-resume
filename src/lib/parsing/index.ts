import { convertPdf } from "@/lib/parsing/docling";
import { parseWithGemini } from "@/lib/parsing/models/gemini";
import { parseWithNvidia } from "@/lib/parsing/models/nvidia";
import { PLACEHOLDER_FIELDS, resolvePipeline } from "@/lib/parsing/pipeline";
import type { ParseInput, ParseResult } from "@/lib/parsing/types";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Generic resume-parse entry point. Picks a pipeline from `RESUME_PARSER`
 * (or `input.pipeline`), converts through Docling when that pipeline needs
 * it, then calls the matching model adapter.
 *
 * Never throws. Missing credentials return `PLACEHOLDER_FIELDS` so
 * `npm run dev` stays runnable without cloud keys. `rawText` is Docling
 * markdown on the Docling pipelines and null on `gemini-direct`.
 */
async function parseResume(input: ParseInput): Promise<ParseResult> {
  const startedAt = Date.now();
  let rawText: string | null = null;

  const done = (partial: Omit<ParseResult, "latencyMs">): ParseResult => ({
    ...partial,
    latencyMs: Date.now() - startedAt,
  });

  try {
    const { pipeline, ready } = resolvePipeline(input.pipeline);
    if (!ready) {
      return done({
        ok: true,
        data: PLACEHOLDER_FIELDS,
        rawText: null,
        usage: null,
        error: null,
      });
    }

    if (pipeline === "gemini-direct") {
      const parsed = await parseWithGemini({
        bytes: input.bytes,
        roleDescription: input.roleDescription,
      });
      return done({ ...parsed, rawText: null });
    }

    const converted = await convertPdf({
      bytes: input.bytes,
      fileName: input.fileName,
    });
    rawText = converted.markdown;
    if (!converted.ok || converted.documentJson == null) {
      return done({
        ok: false,
        data: null,
        rawText,
        usage: null,
        error: converted.error ?? {
          stage: "docling",
          message: "Docling conversion failed.",
        },
      });
    }

    const parsed =
      pipeline === "docling-nvidia"
        ? await parseWithNvidia({
            documentJson: converted.documentJson,
            roleDescription: input.roleDescription,
          })
        : await parseWithGemini({
            documentJson: converted.documentJson,
            roleDescription: input.roleDescription,
          });

    return done({ ...parsed, rawText });
  } catch (error) {
    return done({
      ok: false,
      data: null,
      rawText,
      usage: null,
      error: {
        stage: "parse",
        message: errorMessage(error, "Resume parse failed."),
      },
    });
  }
}

export { parseResume };
export type { ParseInput, ParseResult };
