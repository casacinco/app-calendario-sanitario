import { listBanners } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { BannersManager } from "@/components/content/banners-manager";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await listBanners(getEnv().DB);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
        <p className="text-text-muted text-sm mt-1">
          Gerencie os banners exibidos na dashboard do aluno
        </p>
      </header>
      <BannersManager initialBanners={banners} />
    </div>
  );
}
