import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getModule, listLessons } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { ModuleDetail } from "@/components/content/module-detail";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModuloDetailPage({ params }: PageProps) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId) || moduleId <= 0) notFound();

  const [mod, lessons] = await Promise.all([
    getModule(getEnv().DB, moduleId),
    listLessons(getEnv().DB, moduleId),
  ]);
  if (!mod) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/conteudo/modulos"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para módulos
        </Link>
      </div>
      <ModuleDetail module={mod} initialLessons={lessons} />
    </div>
  );
}
