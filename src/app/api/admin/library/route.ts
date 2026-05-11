import { listLibraryFiles, addLibraryFile } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import type { ContentFileType } from "@/lib/db";

export const runtime = "edge";

const VALID_TYPES: ContentFileType[] = ["pdf", "spreadsheet", "image", "document", "other"];

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
  if (!String(body.url ?? "").trim())  return Response.json({ error: "Arquivo é obrigatório" }, { status: 400 });

  const fileType: ContentFileType = VALID_TYPES.includes(body.file_type as ContentFileType)
    ? (body.file_type as ContentFileType)
    : "other";

  try {
    const file = await addLibraryFile(getEnv().DB, {
      name:          String(body.name).trim(),
      url:           String(body.url).trim(),
      file_type:     fileType,
      notes:         body.notes ? String(body.notes).trim() : null,
      file_size:     typeof body.file_size === "number" ? body.file_size : null,
      original_name: body.original_name ? String(body.original_name) : null,
    });
    return Response.json({ file }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
