import { toggleCalendarRow } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId) || rowId <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const row = await toggleCalendarRow(getEnv().DB, rowId);
    return Response.json({ row });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
