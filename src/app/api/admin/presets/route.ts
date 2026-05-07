import { listCustomPresets, saveCustomPreset } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  try {
    const presets = await listCustomPresets(getEnv().DB);
    return Response.json({ presets });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: { name?: string; bars?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  }
  if (!Array.isArray(body.bars)) {
    return Response.json({ error: "Bars inválido" }, { status: 400 });
  }

  try {
    const preset = await saveCustomPreset(getEnv().DB, {
      name: body.name.trim(),
      bars_json: JSON.stringify(body.bars),
    });
    return Response.json({ preset });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
