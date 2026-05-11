import { listLessons, listModules } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { LessonsAll } from "@/components/content/lessons-all";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AulasPage() {
  const [lessons, modules] = await Promise.all([
    listLessons(getEnv().DB),
    listModules(getEnv().DB),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Aulas</h1>
        <p className="text-text-muted text-sm mt-1">
          Todas as aulas cadastradas — filtre por módulo ou crie uma nova
        </p>
      </header>
      <LessonsAll initialLessons={lessons} modules={modules} />
    </div>
  );
}
