import type { ParseError } from "@/lib/parsing/types";

const CONVERT_PATH = "/v1/convert/file";
/** Sit at Cloudflare's 125s proxy-read ceiling; Docling itself gives up at 120s. */
const CONVERT_TIMEOUT_MS = 125_000;
/** Below this, the PDF is almost certainly a scan (or otherwise empty of text). */
const MIN_MARKDOWN_CHARS = 200;
const SCAN_ERROR =
  "This PDF has no readable text - it looks like a scan. Export a text PDF.";

/**
 * Same knobs as the POC CONVERT_OPTIONS, with `md` added so `rawText` can be
 * stored, and `generate_*` renamed to the serve API's `include_*` fields.
 */
const CONVERT_OPTIONS = {
  to_formats: ["json", "md"],
  pipeline: "standard",
  do_ocr: false,
  image_export_mode: "placeholder",
  include_images: false,
  include_page_images: false,
} as const;

// Keep Docling's own objects. Drop page images, pictures, furniture, and
// other collections that are not structured text for an LLM.
const LLM_DOCUMENT_KEYS = ["body", "groups", "texts", "tables"] as const;

type ConvertPdfInput = {
  bytes: Uint8Array;
  fileName: string;
};

type ConvertPdfResult = {
  ok: boolean;
  documentJson: string | null;
  markdown: string | null;
  latencyMs: number;
  error: ParseError | null;
};

type DoclingDocument = {
  json_content?: unknown;
  md_content?: string | null;
};

type DoclingPayload = {
  document?: DoclingDocument | null;
  status?: string | null;
  errors?: unknown;
  detail?: unknown;
  message?: string;
};

function getConfig() {
  const baseUrl = process.env.DOCLING_URL?.trim();
  const apiKey = process.env.DOCLING_API_KEY?.trim();
  if (!baseUrl) throw new Error("DOCLING_URL is not set.");
  if (!apiKey) throw new Error("DOCLING_API_KEY is not set.");
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (!Array.isArray(detail)) return null;
  const parts = detail.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item];
    if (
      item &&
      typeof item === "object" &&
      "msg" in item &&
      typeof item.msg === "string" &&
      item.msg.trim()
    ) {
      return [item.msg];
    }
    return [];
  });
  return parts.length > 0 ? parts.join("; ") : null;
}

function doclingErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const body = payload as DoclingPayload;
  const detail = detailMessage(body.detail);
  if (detail) return detail;
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const parts = body.errors.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item)
    );
    return parts.join("; ");
  }
  if (typeof body.status === "string" && body.status && body.status !== "success") {
    return `Docling conversion ${body.status}.`;
  }
  return fallback;
}

function appendConvertOptions(form: FormData) {
  for (const [key, value] of Object.entries(CONVERT_OPTIONS)) {
    if (Array.isArray(value)) {
      for (const item of value) form.append(key, item);
      continue;
    }
    if (typeof value === "boolean") {
      form.append(key, value ? "true" : "false");
      continue;
    }
    form.append(key, String(value));
  }
}

function keepStructuredText(doc: unknown) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return doc;
  const source = doc as Record<string, unknown>;
  const kept: Record<string, unknown> = {};
  for (const key of LLM_DOCUMENT_KEYS) {
    const value = source[key];
    if (value == null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    kept[key] = value;
  }
  return Object.keys(kept).length > 0 ? kept : doc;
}

function readableMarkdown(markdown: string) {
  return markdown.replace(/<!--[\s\S]*?-->/g, "").trim();
}

/**
 * Convert a PDF through Docling Serve. Hand-rolled fetch rather than
 * `docling-sdk`, which pulls in CLI-only deps (`child_process`, `archiver`,
 * `ws`) that a Vercel function will never use.
 *
 * Never throws. A failure is a returned value. Short markdown is treated as a
 * scan, not as an empty candidate for the LLM to invent fields from.
 */
async function convertPdf(input: ConvertPdfInput): Promise<ConvertPdfResult> {
  const result: ConvertPdfResult = {
    ok: false,
    documentJson: null,
    markdown: null,
    latencyMs: 0,
    error: null,
  };

  const startedAt = Date.now();
  let response: Response;
  let payload: unknown = null;
  try {
    const { baseUrl, apiKey } = getConfig();
    const form = new FormData();
    const fileName = input.fileName.trim() || "resume.pdf";
    form.append(
      "files",
      new File([Buffer.from(input.bytes)], fileName, {
        type: "application/pdf",
      })
    );
    appendConvertOptions(form);

    response = await fetch(`${baseUrl}${CONVERT_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      body: form,
      signal: AbortSignal.timeout(CONVERT_TIMEOUT_MS),
    });
    const bodyText = await response.text();
    try {
      payload = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      payload = null;
    }
    if (!response.ok) {
      result.latencyMs = Date.now() - startedAt;
      const fallback =
        response.status === 524
          ? "Docling conversion timed out (Cloudflare 524)."
          : `Docling API ${response.status} ${response.statusText}`;
      result.error = {
        stage: "docling",
        message: doclingErrorMessage(payload, fallback),
      };
      return result;
    }
  } catch (error) {
    result.latencyMs = Date.now() - startedAt;
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    result.error = {
      stage: "docling",
      message: timedOut
        ? "Docling conversion timed out."
        : errorMessage(error, "Docling request failed."),
    };
    return result;
  }
  result.latencyMs = Date.now() - startedAt;

  const body = payload as DoclingPayload | null;
  const status = body?.status ?? null;
  if (status === "failure" || status === "skipped") {
    result.error = {
      stage: "docling",
      message: doclingErrorMessage(
        payload,
        `Docling returned no json_content (status=${status}).`
      ),
    };
    return result;
  }

  const raw = body?.document?.json_content ?? null;
  if (raw == null) {
    result.error = {
      stage: "docling",
      message: `Docling returned no json_content (status=${status}).`,
    };
    return result;
  }

  let document: unknown;
  try {
    document = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    result.error = { stage: "json", message: errorMessage(error, "Invalid JSON") };
    return result;
  }

  const markdown =
    typeof body?.document?.md_content === "string" ? body.document.md_content : "";
  if (readableMarkdown(markdown).length < MIN_MARKDOWN_CHARS) {
    result.error = { stage: "docling", message: SCAN_ERROR };
    return result;
  }

  result.documentJson = JSON.stringify(keepStructuredText(document));
  result.markdown = markdown;
  result.ok = true;
  return result;
}

export {
  CONVERT_OPTIONS,
  CONVERT_TIMEOUT_MS,
  MIN_MARKDOWN_CHARS,
  convertPdf,
  type ConvertPdfInput,
  type ConvertPdfResult,
};
