import { NextRequest, NextResponse } from "next/server";
import { getMigrationEvents } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const events = await getMigrationEvents(getEnv().DB, requestId);
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar histórico" },
      { status: 500 },
    );
  }
}
