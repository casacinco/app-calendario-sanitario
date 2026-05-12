import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getEnv } from "@/lib/cf";
import { getUserById, getUserAccess, listPublishedModulesWithLessons } from "@/lib/db";
import { ModulesList } from "@/components/content/modules-list";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ConteudosPage() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const db = getEnv().DB;
  const [user, access] = await Promise.all([
    getUserById(db, Number(uid)),
    getUserAccess(db, Number(uid)),
  ]);
  if (!user) redirect("/auth");

  const [modules, progressRes] = await Promise.all([
    listPublishedModulesWithLessons(db, access),
    db
      .prepare(`SELECT lesson_id FROM lesson_progress WHERE user_id = ?1 AND completed = 1`)
      .bind(Number(uid))
      .all<{ lesson_id: number }>(),
  ]);

  const completedIds = progressRes.results.map((r) => r.lesson_id);

  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <h1 className="text-base font-bold text-gray-900">Conteúdos</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {modules.length > 0 ? (
          <ModulesList modules={modules} completedIds={completedIds} />
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-900">Conteúdos em breve</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Novos módulos sobre manejo sanitário serão disponibilizados aqui em breve.
            </p>
          </div>
        )}
      </main>

    </div>
  );
}
