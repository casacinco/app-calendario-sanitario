import { deleteLibraryFile, listLibraryFiles } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isFinite(fileId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  const env = getEnv();

  try {
    // Fetch before deleting so we can clean up R2
    const all   = await listLibraryFiles(env.DB);
    const entry = all.find((f) => f.id === fileId);

    await deleteLibraryFile(env.DB, fileId);

    // Remove from R2 if URL is internal (/api/media/...)
    if (entry?.url.startsWith("/api/media/")) {
      const key = entry.url.replace("/api/media/", "");
      try { await env.MEDIA.delete(key); } catch { /* non-fatal */ }
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
