import { renameCalendarBlock, deleteCalendarBlock } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string; position: string }>;
}

function parseIntParam(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, position } = await context.params;
  const calendarId = parseIntParam(id);
  const blockPosition = parseIntParam(position);
  if (!calendarId || !blockPosition) {
    return Response.json({ error: "Invalid params" }, { status: 400 });
  }

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
    await renameCalendarBlock(getEnv().DB, {
      calendar_id: calendarId,
      block_position: blockPosition,
      new_name: body.name.trim(),
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, position } = await context.params;
  const calendarId = parseIntParam(id);
  const blockPosition = parseIntParam(position);
  if (!calendarId || !blockPosition) {
    return Response.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    await deleteCalendarBlock(getEnv().DB, {
      calendar_id: calendarId,
      block_position: blockPosition,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
