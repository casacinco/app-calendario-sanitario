import { updateCalendarRowName, deleteCalendarRow } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const rowId = parseId(id);
  if (!rowId) return Response.json({ error: "Invalid id" }, { status: 400 });

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const row = await updateCalendarRowName(getEnv().DB, rowId, body.name.trim());
    return Response.json({ row });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const rowId = parseId(id);
  if (!rowId) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteCalendarRow(getEnv().DB, rowId);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
