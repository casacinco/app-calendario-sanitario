import { cookies } from "next/headers";
import { getEnv } from "@/lib/cf";
import type { CalendarEventStatus } from "@/lib/calendar-events";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  action: "complete" | "postpone" | "skip";
  notes?: string;
  completed_at?: string;
  postponed_to?: string;
}

export async function PATCH(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0)
    return Response.json({ error: "Invalid event id" }, { status: 400 });

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getEnv().DB;

  // Garante que o evento pertence ao usuário autenticado
  const existing = await db
    .prepare(`SELECT id, user_id FROM calendar_events WHERE id = ?1`)
    .bind(eventId)
    .first<{ id: number; user_id: number }>();

  if (!existing || existing.user_id !== Number(uid))
    return Response.json({ error: "Not found" }, { status: 404 });

  let newStatus: CalendarEventStatus;
  let completedAt: string | null = null;
  let postponedTo: string | null = null;

  if (body.action === "complete") {
    newStatus   = "completed";
    completedAt = body.completed_at ?? new Date().toISOString().slice(0, 10);
  } else if (body.action === "postpone") {
    newStatus   = "postponed";
    postponedTo = body.postponed_to ?? null;
  } else if (body.action === "skip") {
    newStatus = "skipped";
  } else {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await db
    .prepare(
      `UPDATE calendar_events
       SET status       = ?1,
           completed_at = ?2,
           postponed_to = ?3,
           notes        = COALESCE(?4, notes),
           updated_at   = datetime('now')
       WHERE id = ?5
       RETURNING *`,
    )
    .bind(newStatus, completedAt, postponedTo, body.notes ?? null, eventId)
    .first();

  return Response.json({ event: updated });
}
