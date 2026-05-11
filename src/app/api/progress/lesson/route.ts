import { cookies } from "next/headers";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return Response.json({ error: "Não autenticado" }, { status: 401 });

  let body: { lesson_id?: number; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { lesson_id, completed = false } = body;
  if (!lesson_id) return Response.json({ error: "lesson_id obrigatório" }, { status: 400 });

  const db  = getEnv().DB;
  const uid_ = Number(uid);

  const lesson = await db
    .prepare(`SELECT id FROM content_lessons WHERE id = ?1 AND status = 'published'`)
    .bind(lesson_id)
    .first<{ id: number }>();

  if (!lesson) return Response.json({ error: "Aula não encontrada" }, { status: 404 });

  if (completed) {
    await db
      .prepare(
        `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, last_accessed_at, access_count)
         VALUES (?1, ?2, 1, datetime('now'), datetime('now'), 1)
         ON CONFLICT(user_id, lesson_id) DO UPDATE SET
           completed        = 1,
           completed_at     = COALESCE(completed_at, datetime('now')),
           last_accessed_at = datetime('now'),
           access_count     = access_count + 1`,
      )
      .bind(uid_, lesson_id)
      .run();
    await db
      .prepare(`INSERT INTO user_events (user_id, event_type, lesson_id) VALUES (?1, 'lesson_completed', ?2)`)
      .bind(uid_, lesson_id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO lesson_progress (user_id, lesson_id, last_accessed_at, access_count)
         VALUES (?1, ?2, datetime('now'), 1)
         ON CONFLICT(user_id, lesson_id) DO UPDATE SET
           last_accessed_at = datetime('now'),
           access_count     = access_count + 1`,
      )
      .bind(uid_, lesson_id)
      .run();
    await db
      .prepare(`INSERT INTO user_events (user_id, event_type, lesson_id) VALUES (?1, 'lesson_viewed', ?2)`)
      .bind(uid_, lesson_id)
      .run();
  }

  return Response.json({ ok: true });
}
