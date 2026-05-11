import { redirect } from "next/navigation";

export const runtime = "edge";

export default function AulasPage() {
  redirect("/admin/conteudo/modulos");
}
