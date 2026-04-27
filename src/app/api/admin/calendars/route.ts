import { createCalendarFromRequest } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface CreateCalendarBody {
  request_id: number;
  admin_id: number;
  template_id?: number;
}

export async function POST(request: Request) {
  let body: CreateCalendarBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.request_id || !body?.admin_id) {
    return Response.json(
      { error: "Missing required fields: request_id, admin_id" },
      { status: 400 },
    );
  }

  try {
    const calendar = await createCalendarFromRequest(getEnv().DB, body);
    return Response.json({ calendar }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
