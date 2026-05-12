import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getEnv } from "@/lib/cf";
import {
  getUserById,
  getUserAccess,
  listPublishedModulesWithLessons,
  listAllPublishedLessonFiles,
} from "@/lib/db";
import { ConteudosClient } from "@/components/producer/conteudos-client";
import type { ContentLessonFile } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ConteudosPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const sp = await searchParams;
  const requestedLessonId = sp.lesson ? Number(sp.lesson) : null;

  const db = getEnv().DB;
  const [user, access] = await Promise.all([
    getUserById(db, Number(uid)),
    getUserAccess(db, Number(uid)),
  ]);
  if (!user) redirect("/auth");

  const [modules, allFiles, progressRows] = await Promise.all([
    listPublishedModulesWithLessons(db, access),
    listAllPublishedLessonFiles(db),
    db
      .prepare(
        `SELECT lesson_id, completed, last_accessed_at
         FROM lesson_progress
         WHERE user_id = ?1
         ORDER BY last_accessed_at DESC`,
      )
      .bind(Number(uid))
      .all<{ lesson_id: number; completed: number; last_accessed_at: string }>(),
  ]);

  // Build filesByLesson lookup
  const filesByLesson = new Map<number, ContentLessonFile[]>();
  for (const f of allFiles) {
    const arr = filesByLesson.get(f.lesson_id) ?? [];
    arr.push(f);
    filesByLesson.set(f.lesson_id, arr);
  }

  // Build serialisable structure for the client component
  const clientModules = modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? null,
    thumbnail_url: m.thumbnail_url ?? null,
    accent_color: m.accent_color ?? "#111111",
    lessons: m.lessons.map((l) => ({
      id: l.id,
      module_id: l.module_id,
      title: l.title,
      description: l.description ?? null,
      video_url: l.video_url ?? null,
      thumbnail_url: l.thumbnail_url ?? null,
      duration_minutes: l.duration_minutes ?? null,
      files: (filesByLesson.get(l.id) ?? []).map((f) => ({
        id: f.id,
        lesson_id: f.lesson_id,
        name: f.name,
        url: f.url,
        file_type: f.file_type,
      })),
    })),
  }));

  const completedIds = progressRows.results
    .filter((r) => r.completed === 1)
    .map((r) => r.lesson_id);

  const isFirstAccess = progressRows.results.length === 0;

  // Determine initial lesson: URL param > last accessed > first lesson
  type ClientLesson = (typeof clientModules)[number]["lessons"][number];
  let initialLesson: ClientLesson | null = null;

  const findLesson = (id: number): ClientLesson | null => {
    for (const mod of clientModules) {
      const found = mod.lessons.find((l) => l.id === id);
      if (found) return found;
    }
    return null;
  };

  if (requestedLessonId) initialLesson = findLesson(requestedLessonId);
  if (!initialLesson && progressRows.results.length > 0) {
    const last = progressRows.results[0];
    if (last) initialLesson = findLesson(last.lesson_id);
  }
  if (!initialLesson && clientModules[0]?.lessons[0]) {
    initialLesson = clientModules[0].lessons[0];
  }

  return (
    <div className="bg-[#F6F6F6] min-h-screen">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <h1 className="text-base font-bold text-gray-900">Conteúdos</h1>
        </div>
      </header>

      <ConteudosClient
        modules={clientModules}
        completedIds={completedIds}
        initialLesson={initialLesson}
        isFirstAccess={isFirstAccess}
      />
    </div>
  );
}
