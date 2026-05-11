import { reorderLessons } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { module_id, ids } = body;
  if (!module_id || !Array.isArray(ids) || !ids.every((x) => typeof x === "number")) {
    return Response.json({ error: "module_id e ids são obrigatórios" }, { status: 400 });
  }

  try {
    await reorderLessons(getEnv().DB, Number(module_id), ids as number[]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
