import { deleteBar, updateBar } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdateBarBody {
  start_month?: number;
  end_month?: number;
  label?: string | null;
  color?: string;
  alert?: boolean;
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const barId = parseId(id);
  if (!barId) return Response.json({ error: "Invalid id" }, { status: 400 });

  let body: UpdateBarBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const bar = await updateBar(getEnv().DB, barId, body);
    return Response.json({ bar });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const barId = parseId(id);
  if (!barId) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteBar(getEnv().DB, barId);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
