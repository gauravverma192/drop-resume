import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { getSubmissionFile } from "@/lib/data";
import { caughtErrorResponse } from "@/lib/http/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const file = await getSubmissionFile(user.id, id);

    if (file.kind === "redirect") {
      const response = NextResponse.redirect(file.url);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    return new Response(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.fileMime,
        "Content-Disposition": `inline; filename="${file.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
