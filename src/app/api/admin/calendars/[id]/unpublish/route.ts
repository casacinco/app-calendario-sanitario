import { unpublishCalendar } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) {
    return Response.json({ error: "Invalid calendar id" }, { status: 400 });
  }

  try {
    const calendar = await unpublishCalendar(getEnv().DB, calendarId);
    return Response.json({ calendar });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
