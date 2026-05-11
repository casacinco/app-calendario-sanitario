import { deleteLessonFile } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const id = Number(fileId);
  if (!Number.isFinite(id)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    await deleteLessonFile(getEnv().DB, id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
