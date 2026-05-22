import { cookies } from "next/headers";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function POST() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await getEnv().DB
    .prepare(
      `UPDATE calendar_requests
       SET calendar_intro_confirmed    = 1,
           calendar_intro_confirmed_at = datetime('now')
       WHERE user_id = ?1
         AND calendar_intro_confirmed  = 0
         AND status = 'delivered'
         AND solicitation_type         = 'standard'
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(Number(uid))
    .run();

  return Response.json({ ok: true });
}
