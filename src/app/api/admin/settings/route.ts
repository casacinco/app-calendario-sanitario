import { getSetting, setSetting } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

const ALLOWED_KEYS = new Set(["content_home_banner_url"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key || !ALLOWED_KEYS.has(key)) {
    return Response.json({ error: "Chave inválida" }, { status: 400 });
  }
  try {
    const value = await getSetting(getEnv().DB, key);
    return Response.json({ key, value });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const key = String(body.key ?? "");
  if (!ALLOWED_KEYS.has(key)) {
    return Response.json({ error: "Chave inválida" }, { status: 400 });
  }
  const value = body.value != null ? String(body.value).trim() || null : null;

  try {
    await setSetting(getEnv().DB, key, value);
    return Response.json({ key, value });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
