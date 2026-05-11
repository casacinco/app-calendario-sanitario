import { listModules, createModule } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  try {
    const modules = await listModules(getEnv().DB);
    return Response.json({ modules });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!String(body.title ?? "").trim()) return Response.json({ error: "Título é obrigatório" }, { status: 400 });

  try {
    const mod = await createModule(getEnv().DB, {
      title:         String(body.title).trim(),
      description:   body.description ? String(body.description).trim() : null,
      thumbnail_url: body.thumbnail_url ? String(body.thumbnail_url).trim() : null,
      accent_color:  body.accent_color ? String(body.accent_color).trim() : "#5FAF3E",
      status:        (["active","hidden","blocked"].includes(String(body.status ?? "")) ? body.status : "active") as "active"|"hidden"|"blocked",
    });
    return Response.json({ module: mod }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
