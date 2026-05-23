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

interface EventRow {
  id: number;
  user_id: number;
  calendar_id: number;
  request_id: number;
  block_name: string;
  row_name: string;
  category_name: string | null;
  title: string;
  recommendation: string | null;
  is_reforco: number;
  parent_event_id: number | null;
}

// Detecta se o manejo tem protocolo de duas etapas (dose + reforço).
// Eventos que já são reforço não geram outro.
function needsReforco(event: EventRow): boolean {
  if (event.is_reforco) return false;
  return (event.recommendation ?? "").toUpperCase().includes("DOSE + REFORÇO");
}

// Dias até o reforço conforme a categoria do manejo.
function reforcoDelayDays(category: string | null): number {
  const cat = (category ?? "").toUpperCase();
  if (cat.includes("VERMIF")) return 21;
  return 30; // vacinas e demais
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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

  const existing = await db
    .prepare(
      `SELECT id, user_id, calendar_id, request_id, block_name, row_name,
              category_name, title, recommendation, is_reforco, parent_event_id
       FROM calendar_events WHERE id = ?1`,
    )
    .bind(eventId)
    .first<EventRow>();

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

  // Salva application_date junto com completed_at nos manejos de dose+reforço
  const applicationDate = body.action === "complete" ? completedAt : null;

  const updated = await db
    .prepare(
      `UPDATE calendar_events
       SET status           = ?1,
           completed_at     = ?2,
           postponed_to     = ?3,
           notes            = COALESCE(?4, notes),
           application_date = COALESCE(?5, application_date),
           updated_at       = datetime('now')
       WHERE id = ?6
       RETURNING *`,
    )
    .bind(newStatus, completedAt, postponedTo, body.notes ?? null, applicationDate, eventId)
    .first();

  // ── Lógica de dose+reforço ─────────────────────────────────────────────────
  if (body.action === "complete" && completedAt && needsReforco(existing)) {
    // Verifica se já existe reforço para evitar duplicatas
    const existing_reforco = await db
      .prepare(
        `SELECT id, due_date FROM calendar_events
         WHERE parent_event_id = ?1 AND is_reforco = 1 LIMIT 1`,
      )
      .bind(eventId)
      .first<{ id: number; due_date: string }>();

    if (existing_reforco) {
      return Response.json({
        event: updated,
        reforco: { created: false, already_exists: true, due_date: existing_reforco.due_date },
      });
    }

    const delay        = reforcoDelayDays(existing.category_name);
    const reforcoDate  = addDays(completedAt, delay);
    const reforcoMonth = new Date(reforcoDate + "T00:00:00Z").getUTCMonth() + 1;
    const reforcoTitle = `${existing.title} — REFORÇO`;

    const reforco = await db
      .prepare(
        `INSERT INTO calendar_events
           (user_id, calendar_id, request_id, block_name, row_name, category_name,
            event_type, title, recommendation, month, start_month, end_month,
            start_part, end_part, status, due_date,
            parent_event_id, is_reforco, generated_automatically, application_date)
         VALUES (?1,?2,?3,?4,?5,?6,'scheduled',?7,'Reforço automático',?8,?8,?8,
                 'start','end','pending',?9,?10,1,1,?11)
         RETURNING id, due_date, title`,
      )
      .bind(
        existing.user_id,
        existing.calendar_id,
        existing.request_id,
        existing.block_name,
        existing.row_name,
        existing.category_name,
        reforcoTitle,
        reforcoMonth,
        reforcoDate,
        eventId,
        completedAt,
      )
      .first<{ id: number; due_date: string; title: string }>();

    return Response.json({
      event: updated,
      reforco: { created: true, due_date: reforcoDate, title: reforcoTitle, id: reforco?.id },
    });
  }

  return Response.json({ event: updated });
}
