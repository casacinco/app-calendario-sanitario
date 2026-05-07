import { toggleMemberStatus } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isFinite(memberId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    const member = await toggleMemberStatus(getEnv().DB, memberId);
    return Response.json({ member });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
