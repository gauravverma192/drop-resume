import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { parseSubmissionQuery } from "@/lib/contracts/query";
import { exportSubmissionsCsv } from "@/lib/data";
import { caughtErrorResponse } from "@/lib/http/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const query = parseSubmissionQuery(new URL(request.url).searchParams);
    const csv = await exportSubmissionsCsv(user.id, id, query);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="submissions-${id}.csv"`,
      },
    });
  } catch (error) {
    return caughtErrorResponse(error);
  }
}
