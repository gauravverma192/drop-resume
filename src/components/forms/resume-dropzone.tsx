"use client";

import * as React from "react";
import { Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ACCEPTED_RESUME_MIME_TYPES,
  MAX_RESUME_BYTES,
} from "@/lib/contracts/submissions";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES: readonly string[] = ACCEPTED_RESUME_MIME_TYPES;
const ACCEPT = ".pdf,application/pdf";
const ACCEPTED_EXTENSIONS = /\.pdf$/i;
const TEXT_DOCUMENT = /\.(docx?|rtf|odt|pages|txt)$/i;

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Number(mb.toFixed(1))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Null when the file is fine, otherwise why it was turned away. */
function rejectionReason(file: File, maxBytes: number) {
  // Drag-and-drop from some file managers arrives without a MIME type.
  const accepted = file.type
    ? ACCEPTED_TYPES.includes(file.type)
    : ACCEPTED_EXTENSIONS.test(file.name);

  if (!accepted) {
    return TEXT_DOCUMENT.test(file.name)
      ? "Word and text files can't be read. Export a PDF instead."
      : "PDF only. Export a PDF instead.";
  }
  if (file.size > maxBytes) {
    return `That file is ${formatSize(file.size)}. The limit is ${formatSize(maxBytes)}.`;
  }
  return null;
}

function ResumeDropzone({
  id,
  name = "resume",
  maxBytes = MAX_RESUME_BYTES,
  required,
  disabled,
  onFileChange,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children" | "onChange"> & {
  name?: string;
  maxBytes?: number;
  required?: boolean;
  disabled?: boolean;
  onFileChange?: (file: File | null) => void;
}) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  function select(next: File | null) {
    const reason = next && rejectionReason(next, maxBytes);
    if (reason) {
      // Keep the rejected file out of the submission entirely.
      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
      setError(reason);
      onFileChange?.(null);
      return;
    }

    setFile(next);
    setError(null);
    onFileChange?.(next);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;

    const dropped = event.dataTransfer.files.item(0);
    if (!dropped) return;

    // A drop never reaches the input on its own, so mirror it across for the
    // form submission.
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(dropped);
      inputRef.current.files = transfer.files;
    }
    select(dropped);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    select(null);
  }

  return (
    <div
      data-slot="resume-dropzone"
      className={cn("grid justify-items-start gap-2", className)}
      {...props}
    >
      <label
        htmlFor={inputId}
        data-dragging={dragging || undefined}
        data-invalid={error ? true : undefined}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          // Crossing into the text inside the zone is not leaving it.
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
          }
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "grid w-full cursor-pointer place-items-center gap-1 rounded-xl border-[1.5px] border-dashed border-accent-line bg-accent-subtle p-4 text-center text-muted-foreground transition-colors",
          "hover:border-primary/60 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent",
          "data-dragging:border-primary data-dragging:bg-accent",
          "data-invalid:border-destructive/50 data-invalid:bg-destructive-bg/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={ACCEPT}
          required={required}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => select(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <strong className="flex items-center gap-1.5 text-primary-deep">
              <Paperclip className="size-3.5" />
              {file.name}
            </strong>
            {formatSize(file.size)} · Choose a different file
          </>
        ) : (
          <>
            <strong className="text-primary-deep">
              Drop a PDF
            </strong>
            Max {formatSize(maxBytes)}.
          </>
        )}
      </label>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      {file ? (
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <X />
          Remove
        </Button>
      ) : null}
    </div>
  );
}

export { ResumeDropzone, MAX_RESUME_BYTES };
