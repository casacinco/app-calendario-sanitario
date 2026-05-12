import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  await getEnv().DB
    .prepare(
      `UPDATE calendar_requests
       SET first_viewed_at = datetime('now')
       WHERE user_id = ?1
         AND first_viewed_at IS NULL
         AND status = 'delivered'
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(Number(uid))
    .run();

  redirect("/dashboard/calendario");
}
