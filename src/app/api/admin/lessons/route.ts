import { listLessons, createLesson } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const moduleId = url.searchParams.get("module_id");

  try {
    const lessons = await listLessons(getEnv().DB, moduleId ? Number(moduleId) : undefined);
    return Response.json({ lessons });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.module_id) return Response.json({ error: "module_id é obrigatório" }, { status: 400 });
  if (!String(body.title ?? "").trim()) return Response.json({ error: "Título é obrigatório" }, { status: 400 });

  try {
    const lesson = await createLesson(getEnv().DB, {
      module_id:        Number(body.module_id),
      title:            String(body.title).trim(),
      description:      body.description ? String(body.description).trim() : null,
      thumbnail_url:    body.thumbnail_url ? String(body.thumbnail_url).trim() : null,
      video_url:        body.video_url ? String(body.video_url).trim() : null,
      duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : null,
      status:           (["published","draft","hidden"].includes(String(body.status ?? "")) ? body.status : "draft") as "published"|"draft"|"hidden",
    });
    return Response.json({ lesson }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
