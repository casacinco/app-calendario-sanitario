import { redirect } from "next/navigation";

export const runtime = "edge";

export default function ModuleDetailPage() {
  redirect("/admin/conteudo/modulos");
}
