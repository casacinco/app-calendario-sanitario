import { createCalendarBlockNote } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) {
    return Response.json({ error: "Invalid calendar id" }, { status: 400 });
  }

  let body: { block_position?: number; text?: string; position?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.text?.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }
  if (typeof body.block_position !== "number") {
    return Response.json({ error: "block_position is required" }, { status: 400 });
  }

  try {
    const note = await createCalendarBlockNote(getEnv().DB, {
      calendar_id: calendarId,
      block_position: body.block_position,
      text: body.text.trim(),
      position: body.position ?? 0,
    });
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
