import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FormularioForm } from "@/components/formulario-form";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function FormularioPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("rb_migration")?.value === "1") {
    redirect("/migracao");
  }
  return <FormularioForm />;
}
