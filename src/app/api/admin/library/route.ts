import { listLibraryFiles, addLibraryFile } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  try {
    const files = await listLibraryFiles(getEnv().DB);
    return Response.json({ files });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!String(body.name ?? "").trim()) return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!String(body.url ?? "").trim()) return Response.json({ error: "URL é obrigatória" }, { status: 400 });

  try {
    const file = await addLibraryFile(getEnv().DB, {
      name:      String(body.name).trim(),
      url:       String(body.url).trim(),
      file_type: (["pdf","spreadsheet","image","video","link"].includes(String(body.file_type ?? ""))
        ? body.file_type : "link") as "pdf"|"spreadsheet"|"image"|"video"|"link",
      notes:     body.notes ? String(body.notes).trim() : null,
    });
    return Response.json({ file }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
