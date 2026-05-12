import { NextRequest, NextResponse } from "next/server";
import {
  getMember,
  createMember,
  createUserWithPassword,
  getUserByEmail,
  createFarm,
  createCalendarRequest,
  completeMemberMigration,
  createMigrationEvent,
} from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string | null;
    password?: string;
    access_type?: string;
    farm_name?: string;
    state?: string;
    city?: string;
    notes?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { name, email, phone, password, access_type, farm_name, state, city, notes } = body;

  if (!name?.trim())      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!email?.trim())     return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
  if (!password?.trim())  return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 });
  if (!farm_name?.trim()) return NextResponse.json({ error: "Nome da fazenda é obrigatório" }, { status: 400 });
  if (!state?.trim())     return NextResponse.json({ error: "UF é obrigatória" }, { status: 400 });
  if (!city?.trim())      return NextResponse.json({ error: "Cidade é obrigatória" }, { status: 400 });

  const validAccessTypes = ["30d", "90d", "365d", "lifetime"] as const;
  const accessType = (validAccessTypes.includes(access_type as typeof validAccessTypes[number])
    ? access_type
    : "lifetime") as "30d" | "90d" | "365d" | "lifetime";

  const db = getEnv().DB;

  try {
    // Check for duplicate open migration by email (user may already exist)
    const existingUser = await db
      .prepare(`SELECT id FROM users WHERE email = ?1`)
      .bind(email.trim().toLowerCase())
      .first<{ id: number }>();

    if (existingUser) {
      const openMigration = await db
        .prepare(
          `SELECT id FROM calendar_requests
           WHERE user_id = ?1 AND solicitation_type = 'migration'
             AND migration_status IN ('awaiting_migration', 'in_migration', 'internal_review')
           LIMIT 1`,
        )
        .bind(existingUser.id)
        .first<{ id: number }>();

      if (openMigration) {
        return NextResponse.json(
          { error: `Este usuário já possui uma migração em andamento (solicitação #${openMigration.id}).` },
          { status: 409 },
        );
      }
    }

    const password_hash = await hashPassword(password.trim());

    // Calculate expires_at based on access_type
    const daysMap: Record<string, number | null> = { "30d": 30, "90d": 90, "365d": 365, "lifetime": null };
    const days = daysMap[accessType] ?? null;
    const today = new Date().toISOString().split("T")[0];
    const expiresAt = days !== null
      ? (() => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; })()
      : null;

    // 1. Create member (sets migration_completed: implied by manually linking later)
    const member = await createMember(db, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      password: password_hash,
      access_type: accessType,
      expires_at: expiresAt,
      origin: "Manual",
      notes: notes?.trim() || null,
      entry_date: today,
      product_name: "Migração Aplicativo",
    });

    // 2. Create users table entry (enables rb_uid login)
    let user = await getUserByEmail(db, email.trim().toLowerCase());
    if (!user) {
      user = await createUserWithPassword(db, {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password_hash,
      });
    }

    // 3. Create farm
    const farm = await createFarm(db, {
      user_id: user.id,
      name: farm_name.trim(),
      state: state.trim().toUpperCase(),
      city: city.trim(),
      notes: notes?.trim() || null,
    });

    // 4. Create calendar request
    const calendarRequest = await createCalendarRequest(db, {
      user_id:           user.id,
      farm_id:           farm.id,
      solicitation_type: "migration",
      calendar_origin:   "imported",
      migration_status:  "awaiting_migration",
      migration_source:  "manual",
    });

    // 5. Mark migration completed + link request (skips onboarding gate)
    await completeMemberMigration(db, email.trim().toLowerCase(), calendarRequest.id);

    // 6. Audit event
    await createMigrationEvent(db, {
      request_id:   calendarRequest.id,
      event_type:   "created_manual",
      new_value:    "awaiting_migration",
      performed_by: "admin",
      notes:        notes?.trim() || null,
    });

    // 7. Return the full MemberWithRequest shape
    const full = await getMember(db, member.id);
    return NextResponse.json({ member: full }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar usuário de migração" },
      { status: 400 },
    );
  }
}
