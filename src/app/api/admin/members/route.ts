import { listMembers, createMember } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  try {
    const members = await listMembers(getEnv().DB);
    return Response.json({ members });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    profile?: string;
    access_type?: string;
    expires_at?: string;
    password?: string;
    origin?: string;
    notes?: string;
    entry_date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!body.email?.trim()) return Response.json({ error: "E-mail é obrigatório" }, { status: 400 });

  try {
    const password_hash = body.password?.trim()
      ? await hashPassword(body.password.trim())
      : null;

    const member = await createMember(getEnv().DB, {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      status: body.status === "blocked" ? "blocked" : "active",
      profile: (["user", "support", "admin"].includes(body.profile ?? "") ? body.profile : "user") as "user" | "support" | "admin",
      access_type: (["30d", "90d", "365d", "lifetime"].includes(body.access_type ?? "") ? body.access_type : "30d") as "30d" | "90d" | "365d" | "lifetime",
      expires_at: body.expires_at || null,
      password: password_hash,
      origin: body.origin?.trim() || null,
      notes: body.notes?.trim() || null,
      entry_date: body.entry_date || undefined,
    });
    return Response.json({ member }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
