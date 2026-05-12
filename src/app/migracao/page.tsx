import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cf";
import { getUserById } from "@/lib/db";
import { MigrationForm } from "@/components/migration-form";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function MigracaoPage() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  // If no migration flag, redirect to standard onboarding
  if (cookieStore.get("rb_migration")?.value !== "1") {
    redirect("/formulario");
  }

  const user = await getUserById(getEnv().DB, Number(uid));
  if (!user) redirect("/auth");

  return <MigrationForm userName={user.name} />;
}
