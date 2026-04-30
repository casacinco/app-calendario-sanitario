import { updateCalendarBlockNote, deleteCalendarBlockNote } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const noteId = parseId(id);
  if (!noteId) return Response.json({ error: "Invalid id" }, { status: 400 });

  let body: { text?: string; is_visible?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.text !== undefined && !body.text.trim()) {
    return Response.json({ error: "text cannot be empty" }, { status: 400 });
  }

  try {
    const note = await updateCalendarBlockNote(getEnv().DB, noteId, {
      text: body.text?.trim(),
      is_visible: body.is_visible,
    });
    return Response.json({ note });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const noteId = parseId(id);
  if (!noteId) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteCalendarBlockNote(getEnv().DB, noteId);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
