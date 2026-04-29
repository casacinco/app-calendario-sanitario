import { createBar } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface CreateBarBody {
  calendar_row_id: number;
  start_month: number;
  end_month: number;
  label?: string | null;
  color?: string;
  alert?: boolean;
  description?: string | null;
  animal_category?: string | null;
}

export async function POST(request: Request) {
  let body: CreateBarBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body?.calendar_row_id ||
    !Number.isInteger(body.start_month) ||
    !Number.isInteger(body.end_month)
  ) {
    return Response.json(
      { error: "Missing required fields: calendar_row_id, start_month, end_month" },
      { status: 400 },
    );
  }

  try {
    const bar = await createBar(getEnv().DB, body);
    return Response.json({ bar }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
