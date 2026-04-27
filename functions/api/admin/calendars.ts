// POST /api/admin/calendars
// Cria um calendário (draft) a partir de uma solicitação.

import { createCalendarFromRequest } from "../../../src/lib/db";

interface Env {
  DB: D1Database;
}

interface CreateCalendarBody {
  request_id: number;
  admin_id: number;
  template_id?: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: CreateCalendarBody;
  try {
    body = await context.request.json<CreateCalendarBody>();
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
    const calendar = await createCalendarFromRequest(context.env.DB, body);
    return Response.json({ calendar }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
};
