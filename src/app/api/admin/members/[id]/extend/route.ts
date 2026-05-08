import { extendMemberAccess } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isFinite(memberId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  let body: { days?: number; type?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const member = await extendMemberAccess(getEnv().DB, memberId, {
      days: body.days,
      type: body.type === "lifetime" ? "lifetime" : undefined,
    });
    return Response.json({ member });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
