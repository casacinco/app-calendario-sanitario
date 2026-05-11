import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, hashPassword } from "@/lib/auth";
import {
  getUserByEmailWithHash,
  getUserByEmail,
  getMemberByEmail,
  createUserWithPassword,
} from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json<{
      email: string;
      password: string;
    }>();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 },
      );
    }

    const db = getEnv().DB;

    // 1. Try regular users table first
    const user = await getUserByEmailWithHash(db, email);

    if (user && user.password_hash) {
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
      }

      await db.prepare(`INSERT INTO user_events (user_id, event_type) VALUES (?1, 'login')`)
        .bind(user.id).run().catch(() => {});

      const res = NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email },
      });
      res.cookies.set("rb_uid", String(user.id), {
        httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    // 2. Fall back to members table (admin-created accounts)
    const member = await getMemberByEmail(db, email);

    if (!member || !member.password) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    if (member.status === "blocked") {
      return NextResponse.json({ error: "Acesso bloqueado. Entre em contato com o suporte." }, { status: 403 });
    }

    const validMember = await verifyPassword(password, member.password);
    if (!validMember) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Find or create a users entry so rb_uid works across the app
    let linkedUser = await getUserByEmail(db, member.email);
    if (!linkedUser) {
      const password_hash = await hashPassword(password);
      linkedUser = await createUserWithPassword(db, {
        email: member.email,
        name: member.name,
        password_hash,
      });
    }

    await db.prepare(`INSERT INTO user_events (user_id, event_type) VALUES (?1, 'login')`)
      .bind(linkedUser.id).run().catch(() => {});

    const res = NextResponse.json({
      user: { id: linkedUser.id, name: linkedUser.name, email: linkedUser.email },
    });
    res.cookies.set("rb_uid", String(linkedUser.id), {
      httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30,
    });

    // Force onboarding for members who haven't completed it yet
    if (!member.onboarding_completed) {
      res.cookies.set("rb_onboarding", "1", {
        httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
