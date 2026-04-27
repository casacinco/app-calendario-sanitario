// POST /api/admin/calendars/:id/publish
// Publica um calendário e marca a solicitação como entregue.

import { publishCalendar } from "../../../../../src/lib/db";

interface Env {
  DB: D1Database;
}

interface PublishBody {
  admin_id: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const calendarId = Number(context.params.id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) {
    return Response.json({ error: "Invalid calendar id" }, { status: 400 });
  }

  let body: PublishBody;
  try {
    body = await context.request.json<PublishBody>();
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
    const calendar = await publishCalendar(context.env.DB, {
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
};
