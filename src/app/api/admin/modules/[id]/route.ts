import { getModule, updateModule, deleteModule } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isFinite(moduleId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    const mod = await getModule(getEnv().DB, moduleId);
    if (!mod) return Response.json({ error: "Módulo não encontrado" }, { status: 404 });
    return Response.json({ module: mod });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isFinite(moduleId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  try {
    const mod = await updateModule(getEnv().DB, moduleId, {
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: body.description ? String(body.description).trim() : null }),
      ...(body.thumbnail_url !== undefined && { thumbnail_url: body.thumbnail_url ? String(body.thumbnail_url).trim() : null }),
      ...(body.accent_color !== undefined && { accent_color: String(body.accent_color).trim() }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
      ...(body.status !== undefined && { status: (["active","hidden","blocked"].includes(String(body.status)) ? body.status : "active") as "active"|"hidden"|"blocked" }),
    });
    return Response.json({ module: mod });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isFinite(moduleId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    await deleteModule(getEnv().DB, moduleId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
