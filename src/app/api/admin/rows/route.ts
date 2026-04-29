import { createCalendarRow } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface CreateRowBody {
  calendar_id: number;
  block_name: string;
  block_position: number;
  row_name: string;
  row_position: number;
}

export async function POST(request: Request) {
  let body: CreateRowBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body?.calendar_id ||
    !body.block_name?.trim() ||
    !body.row_name?.trim() ||
    !Number.isInteger(body.block_position) ||
    !Number.isInteger(body.row_position)
  ) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const row = await createCalendarRow(getEnv().DB, body);
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
