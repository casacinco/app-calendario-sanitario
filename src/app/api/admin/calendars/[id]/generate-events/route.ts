// Rota administrativa para (re)gerar eventos de um calendário já publicado.
// Usar para calendários existentes antes da implementação automática no publish.
import { getEnv } from "@/lib/cf";
import { generateCalendarEvents } from "@/lib/calendar-events";

export const runtime = "edge";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0)
    return Response.json({ error: "Invalid calendar id" }, { status: 400 });

  try {
    await generateCalendarEvents(getEnv().DB, calendarId);
    return Response.json({ ok: true, calendar_id: calendarId });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
