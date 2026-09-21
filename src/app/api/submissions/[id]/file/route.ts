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
    return new Response(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.fileMime,
        "Content-Disposition": `inline; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
