import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getUserByEmail, createUserWithPassword } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json<{
      email: string;
      name: string;
      password: string;
    }>();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 },
      );
    }

    const db = getEnv().DB;
    const existing = await getUserByEmail(db, email);
    if (existing) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 },
      );
    }

    const password_hash = await hashPassword(password);
    const user = await createUserWithPassword(db, { email, name, password_hash });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
    res.cookies.set("rb_uid", String(user.id), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 },
    );
  }
}
