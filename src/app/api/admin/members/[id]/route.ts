import { getMember, updateMember, deleteMember } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isFinite(memberId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    const member = await getMember(getEnv().DB, memberId);
    if (!member) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    return Response.json({ member });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isFinite(memberId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const member = await updateMember(getEnv().DB, memberId, {
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.email !== undefined && { email: String(body.email).trim().toLowerCase() }),
      ...(body.phone !== undefined && { phone: body.phone ? String(body.phone).trim() : null }),
      ...(body.product !== undefined && { product: body.product ? String(body.product).trim() : null }),
      ...(body.status !== undefined && { status: body.status === "blocked" ? "blocked" : "active" }),
      ...(body.profile !== undefined && { profile: ["user","support","admin"].includes(String(body.profile)) ? (body.profile as "user"|"support"|"admin") : "user" }),
      ...(body.access_type !== undefined && { access_type: ["30d","90d","365d","lifetime"].includes(String(body.access_type)) ? (body.access_type as "30d"|"90d"|"365d"|"lifetime") : "30d" }),
      ...(body.expires_at !== undefined && { expires_at: body.expires_at ? String(body.expires_at) : null }),
      ...(body.password !== undefined && { password: body.password ? String(body.password) : null }),
      ...(body.origin !== undefined && { origin: body.origin ? String(body.origin).trim() : null }),
      ...(body.notes !== undefined && { notes: body.notes ? String(body.notes).trim() : null }),
      ...(body.calendar_request_id !== undefined && {
        calendar_request_id: body.calendar_request_id ? Number(body.calendar_request_id) : null,
      }),
      ...(body.entry_date !== undefined && { entry_date: String(body.entry_date) }),
    });
    return Response.json({ member });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isFinite(memberId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    await deleteMember(getEnv().DB, memberId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
