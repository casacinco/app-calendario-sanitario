import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserById,
  createFarm,
  createCalendarRequest,
  completeMemberMigration,
  createMigrationEvent,
} from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface MigrationBody {
  owner_name: string;
  farm_name:  string;
  state:      string;
  city:       string;
  notes?:     string;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: MigrationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { owner_name, farm_name, state, city, notes } = body;
  if (!owner_name?.trim() || !farm_name?.trim() || !state?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const db     = getEnv().DB;
  const userId = Number(uid);

  const user = await getUserById(db, userId);
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  // Block duplicate open migration
  const openMigration = await db
    .prepare(
      `SELECT id FROM calendar_requests
       WHERE user_id = ?1 AND solicitation_type = 'migration'
         AND migration_status IN ('awaiting_migration', 'in_migration', 'internal_review')
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ id: number }>();

  if (openMigration) {
    return NextResponse.json(
      { error: "Você já possui uma solicitação de migração em andamento. Aguarde a conclusão antes de criar uma nova." },
      { status: 409 },
    );
  }

  try {
    if (owner_name.trim() !== user.name) {
      await db
        .prepare(`UPDATE users SET name = ?1, updated_at = datetime('now') WHERE id = ?2`)
        .bind(owner_name.trim(), userId)
        .run();
    }

    const farm = await createFarm(db, {
      user_id: userId,
      name:    farm_name.trim(),
      state:   state.trim().toUpperCase(),
      city:    city.trim(),
      notes:   notes?.trim() || null,
    });

    const calendarRequest = await createCalendarRequest(db, {
      user_id:           userId,
      farm_id:           farm.id,
      solicitation_type: "migration",
      calendar_origin:   "imported",
      migration_status:  "awaiting_migration",
      migration_source:  "hotmart",
    });

    // Mark migration as completed (separate from onboarding_completed)
    await completeMemberMigration(db, user.email, calendarRequest.id);

    // Audit trail
    await createMigrationEvent(db, {
      request_id:   calendarRequest.id,
      event_type:   "form_submitted",
      new_value:    "awaiting_migration",
      performed_by: "user",
    });

    const res = NextResponse.json({ request: calendarRequest, farm }, { status: 201 });
    res.cookies.set("rb_onboarding", "", { httpOnly: true, path: "/", maxAge: 0 });
    res.cookies.set("rb_migration",  "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar migração" },
      { status: 500 },
    );
  }
}
