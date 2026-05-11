import { deleteLibraryFile } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isFinite(fileId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    await deleteLibraryFile(getEnv().DB, fileId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
