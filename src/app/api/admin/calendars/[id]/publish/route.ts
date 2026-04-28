import { getOrCreateSystemAdmin, publishCalendar } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface PublishBody {
  admin_id?: number;
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

  let body: PublishBody = {};
  try {
    body = await request.json();
  } catch {
    // Body opcional para publicação
  }

  try {
    const db = getEnv().DB;
    const adminId = body.admin_id ?? (await getOrCreateSystemAdmin(db)).id;
    const calendar = await publishCalendar(db, {
      calendar_id: calendarId,
      admin_id: adminId,
    });
    return Response.json({ calendar });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
