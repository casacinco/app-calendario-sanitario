import { listLibraryFiles } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { LibraryManager } from "@/components/content/library-manager";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function BibliotecaPage() {
  const files = await listLibraryFiles(getEnv().DB);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
        <p className="text-text-muted text-sm mt-1">
          Repositório central de materiais — PDFs, planilhas, links e arquivos
        </p>
      </header>
      <LibraryManager initialFiles={files} />
    </div>
  );
}
