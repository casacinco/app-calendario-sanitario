import { getLessonFiles, addLessonFile } from "@/lib/db";
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
    const files = await getLessonFiles(getEnv().DB, lessonId);
    return Response.json({ files });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isFinite(lessonId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!String(body.name ?? "").trim()) return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!String(body.url ?? "").trim()) return Response.json({ error: "URL é obrigatória" }, { status: 400 });

  try {
    const file = await addLessonFile(getEnv().DB, {
      lesson_id: lessonId,
      name:      String(body.name).trim(),
      url:       String(body.url).trim(),
      file_type: (["pdf","spreadsheet","image","document","other"].includes(String(body.file_type ?? ""))
        ? body.file_type : "other") as "pdf"|"spreadsheet"|"image"|"document"|"other",
    });
    return Response.json({ file }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
