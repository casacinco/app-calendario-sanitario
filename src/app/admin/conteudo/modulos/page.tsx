import { listModules } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { ModulesManager } from "@/components/content/modules-manager";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ModulosPage() {
  const modules = await listModules(getEnv().DB);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Módulos</h1>
        <p className="text-text-muted text-sm mt-1">
          Organize o conteúdo por módulos temáticos
        </p>
      </header>
      <ModulesManager initialModules={modules} />
    </div>
  );
}
