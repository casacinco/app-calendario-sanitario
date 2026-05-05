import { deleteAllCalendarBars } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) {
    return Response.json({ error: "Invalid calendar id" }, { status: 400 });
  }
  await deleteAllCalendarBars(getEnv().DB, calendarId);
  return Response.json({ ok: true });
}
