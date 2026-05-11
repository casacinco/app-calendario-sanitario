import { reorderModules } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const ids = body.ids;
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "number")) {
    return Response.json({ error: "ids deve ser um array de números" }, { status: 400 });
  }

  try {
    await reorderModules(getEnv().DB, ids as number[]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
