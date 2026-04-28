import { createCalendarFromRequest, getOrCreateSystemAdmin } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface CreateCalendarBody {
  request_id: number;
  admin_id?: number;
  template_id?: number;
}

export async function POST(request: Request) {
  let body: CreateCalendarBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.request_id) {
    return Response.json(
      { error: "Missing required field: request_id" },
      { status: 400 },
    );
  }

  try {
    const db = getEnv().DB;
    const adminId = body.admin_id ?? (await getOrCreateSystemAdmin(db)).id;
    const calendar = await createCalendarFromRequest(db, {
      request_id: body.request_id,
      admin_id: adminId,
      template_id: body.template_id,
    });
    return Response.json({ calendar }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
