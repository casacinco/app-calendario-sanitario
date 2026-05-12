import { listModules, getSetting } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { ModulesManager } from "@/components/content/modules-manager";
import { ContentBannerSettings } from "@/components/content/content-banner-settings";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ModulosPage() {
  const db = getEnv().DB;
  const [modules, contentBannerUrl] = await Promise.all([
    listModules(db),
    getSetting(db, "content_home_banner_url"),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Módulos</h1>
        <p className="text-text-muted text-sm mt-1">
          Organize o conteúdo por módulos temáticos
        </p>
      </header>

      <ContentBannerSettings initialUrl={contentBannerUrl} />

      <ModulesManager initialModules={modules} />
    </div>
  );
}
