import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { getUserByEmailWithHash } from "@/lib/db";
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
    const user = await getUserByEmailWithHash(db, email);

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

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
