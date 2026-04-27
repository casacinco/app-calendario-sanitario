import { publishCalendar } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface PublishBody {
  admin_id: number;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) {
    return Response.json({ error: "Invalid calendar id" }, { status: 400 });
  }

  let body: PublishBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.admin_id) {
    return Response.json(
      { error: "Missing required field: admin_id" },
      { status: 400 },
    );
  }

  try {
    const calendar = await publishCalendar(getEnv().DB, {
      calendar_id: calendarId,
      admin_id: body.admin_id,
    });
    return Response.json({ calendar });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
