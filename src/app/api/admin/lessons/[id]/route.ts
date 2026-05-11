import { getLesson, updateLesson, deleteLesson } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isFinite(lessonId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    const lesson = await getLesson(getEnv().DB, lessonId);
    if (!lesson) return Response.json({ error: "Aula não encontrada" }, { status: 404 });
    return Response.json({ lesson });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isFinite(lessonId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  try {
    const lesson = await updateLesson(getEnv().DB, lessonId, {
      ...(body.module_id !== undefined && { module_id: Number(body.module_id) }),
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: body.description ? String(body.description).trim() : null }),
      ...(body.thumbnail_url !== undefined && { thumbnail_url: body.thumbnail_url ? String(body.thumbnail_url).trim() : null }),
      ...(body.video_url !== undefined && { video_url: body.video_url ? String(body.video_url).trim() : null }),
      ...(body.duration_minutes !== undefined && { duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : null }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
      ...(body.status !== undefined && { status: (["published","draft","hidden"].includes(String(body.status)) ? body.status : "draft") as "published"|"draft"|"hidden" }),
    });
    return Response.json({ lesson });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isFinite(lessonId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    await deleteLesson(getEnv().DB, lessonId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
