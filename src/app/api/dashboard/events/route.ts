import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cf";
import { getEventsByUser } from "@/lib/calendar-events";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const { scheduled, continuous } = await getEventsByUser(
    getEnv().DB,
    Number(uid),
  );

  return Response.json({ scheduled, continuous });
}
