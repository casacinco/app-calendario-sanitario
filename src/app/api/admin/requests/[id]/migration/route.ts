import { NextRequest, NextResponse } from "next/server";
import {
  updateMigrationRequest,
  createMigrationEvent,
  createNotificationEvent,
} from "@/lib/db";
import { getEnv } from "@/lib/cf";
import type { MigrationStatus, MigrationAssigneeRole } from "@/lib/db";

export const runtime = "edge";

const VALID_STATUSES = new Set<MigrationStatus>([
  "awaiting_migration", "in_migration", "internal_review", "published", "delivered",
]);

const VALID_ROLES = new Set<MigrationAssigneeRole>([
  "operador", "suporte", "equipe_interna", "administrador",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const db = getEnv().DB;

  // Fetch current record to detect changes for auto-timestamps and events
  const current = await db
    .prepare(`SELECT * FROM calendar_requests WHERE id = ?1`)
    .bind(requestId)
    .first<{
      user_id: number;
      migration_status: MigrationStatus | null;
      migration_assignee_role: MigrationAssigneeRole | null;
      migration_started_at: string | null;
      migration_published_at: string | null;
      migration_assigned_at: string | null;
    }>();

  if (!current) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const input: Parameters<typeof updateMigrationRequest>[2] = {};

  if ("migration_status" in body) {
    const s = body.migration_status;
    if (s !== null && !VALID_STATUSES.has(s as MigrationStatus)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    input.migration_status = (s as MigrationStatus | null) ?? null;
  }
  if ("migration_pdf_url"       in body) input.migration_pdf_url       = body.migration_pdf_url       ? String(body.migration_pdf_url)       : null;
  if ("migration_assignee_role" in body) {
    const r = body.migration_assignee_role;
    if (r !== null && !VALID_ROLES.has(r as MigrationAssigneeRole)) {
      return NextResponse.json({ error: "Responsável inválido" }, { status: 400 });
    }
    input.migration_assignee_role = (r as MigrationAssigneeRole | null) ?? null;
  }
  if ("migration_notes"         in body) input.migration_notes         = body.migration_notes         ? String(body.migration_notes)         : null;
  if ("estimated_delivery_date" in body) input.estimated_delivery_date = body.estimated_delivery_date ? String(body.estimated_delivery_date) : null;

  // Auto-set assigned_at when role is being assigned for the first time
  const newRole = input.migration_assignee_role;
  if (newRole !== undefined && newRole !== null && !current.migration_assigned_at) {
    input.migration_assigned_at = new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  // Auto-set started_at when transitioning into in_migration
  const newStatus = input.migration_status;
  if (newStatus === "in_migration" && !current.migration_started_at) {
    input.migration_started_at = new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  // Auto-set published_at when transitioning into published
  if (newStatus === "published" && !current.migration_published_at) {
    input.migration_published_at = new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  try {
    const updated = await updateMigrationRequest(db, requestId, input);

    // Audit: status changed
    if (newStatus !== undefined && newStatus !== current.migration_status) {
      await createMigrationEvent(db, {
        request_id:   requestId,
        event_type:   "status_changed",
        old_value:    current.migration_status ?? undefined,
        new_value:    newStatus ?? undefined,
        performed_by: current.migration_assignee_role ?? undefined,
      });
    }

    // Audit: assignee set
    if (newRole !== undefined && newRole !== current.migration_assignee_role) {
      await createMigrationEvent(db, {
        request_id:   requestId,
        event_type:   "assignee_set",
        old_value:    current.migration_assignee_role ?? undefined,
        new_value:    newRole ?? undefined,
        performed_by: "admin",
      });
    }

    // Audit: PDF uploaded
    if ("migration_pdf_url" in body && input.migration_pdf_url) {
      await createMigrationEvent(db, {
        request_id:   requestId,
        event_type:   "pdf_uploaded",
        performed_by: "admin",
      });
    }

    // Audit: notes updated
    if ("migration_notes" in body && input.migration_notes) {
      await createMigrationEvent(db, {
        request_id:   requestId,
        event_type:   "notes_updated",
        performed_by: "admin",
      });
    }

    // Audit: delivery date set
    if ("estimated_delivery_date" in body && input.estimated_delivery_date) {
      await createMigrationEvent(db, {
        request_id:   requestId,
        event_type:   "delivery_set",
        new_value:    input.estimated_delivery_date,
        performed_by: "admin",
      });
    }

    // Notification: when calendar becomes published, queue WhatsApp payload
    if (newStatus === "published" && current.migration_status !== "published") {
      const userRow = await db
        .prepare(
          `SELECT u.name, m.phone
           FROM users u
           LEFT JOIN members m ON m.email = u.email
           WHERE u.id = ?1`,
        )
        .bind(current.user_id)
        .first<{ name: string; phone: string | null }>();

      if (userRow) {
        await createNotificationEvent(db, {
          user_id:    current.user_id,
          request_id: requestId,
          event_type: "migration_published",
          channel:    "whatsapp",
          title:      "Calendário disponível",
          message:    `Olá ${userRow.name}, seu calendário sanitário já está disponível no aplicativo!`,
          payload: {
            user_name:     userRow.name,
            phone:         userRow.phone,
            event_type:    "migration_published",
            request_id:    requestId,
            status:        "published",
            dashboard_url: "https://rebanho.app/dashboard",
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ request: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar" },
      { status: 500 },
    );
  }
}
