import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, FileText, FileSpreadsheet, ImageIcon, File,
  ExternalLink, Play, CheckCircle2, ChevronRight,
} from "lucide-react";
import { getEnv } from "@/lib/cf";
import {
  getUserById, getPublishedLesson, getLessonFiles,
  getUserAccess, listPublishedModulesWithLessons,
} from "@/lib/db";
import { LessonTracker } from "@/components/content/lesson-tracker";
import type { ContentFileType } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/,
  );
  return m?.[1] ?? null;
}

const FILE_ICONS: Record<ContentFileType, typeof File> = {
  pdf:         FileText,
  spreadsheet: FileSpreadsheet,
  image:       ImageIcon,
  document:    FileText,
  other:       File,
};

const FILE_LABELS: Record<ContentFileType, string> = {
  pdf:         "PDF",
  spreadsheet: "Planilha",
  image:       "Imagem",
  document:    "Documento",
  other:       "Arquivo",
};

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const { id } = await params;
  const lessonId = Number(id);
  if (!lessonId) notFound();

  const db = getEnv().DB;
  const [user, lesson, access] = await Promise.all([
    getUserById(db, Number(uid)),
    getPublishedLesson(db, lessonId),
    getUserAccess(db, Number(uid)),
  ]);

  if (!user) redirect("/auth");
  if (!lesson) notFound();

  const [files, modules, progressRes] = await Promise.all([
    getLessonFiles(db, lessonId),
    listPublishedModulesWithLessons(db, access),
    db
      .prepare(`SELECT lesson_id FROM lesson_progress WHERE user_id = ?1 AND completed = 1`)
      .bind(Number(uid))
      .all<{ lesson_id: number }>(),
  ]);

  const currentModule = modules.find((m) => m.id === lesson.module_id);
  const completedIds = new Set(progressRes.results.map((r) => r.lesson_id));

  const ytId = lesson.video_url ? getYouTubeId(lesson.video_url) : null;

  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard/conteudos"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          {lesson.module_title && (
            <>
              <span className="text-gray-200 text-sm">|</span>
              <p className="text-sm text-gray-500 truncate">{lesson.module_title}</p>
            </>
          )}
        </div>
      </header>

      <LessonTracker lessonId={lessonId} />

      {/* Video — edge-to-edge on mobile */}
      {lesson.video_url && (
        <div className="aspect-video w-full bg-black">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <video
              src={lesson.video_url}
              controls
              className="w-full h-full"
              poster={lesson.thumbnail_url ?? undefined}
            />
          )}
        </div>
      )}

      {/* Thumbnail when no video */}
      {!lesson.video_url && lesson.thumbnail_url && (
        <div className="aspect-video w-full bg-black">
          <img
            src={lesson.thumbnail_url}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Title & meta */}
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-gray-900 leading-snug">{lesson.title}</h1>
          {lesson.duration_minutes && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {lesson.duration_minutes} min
            </span>
          )}
          {lesson.description && (
            <p className="text-sm text-gray-600 leading-relaxed pt-1">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Materials */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Materiais de apoio
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
              {files.map((file) => {
                const Icon = FILE_ICONS[file.file_type] ?? File;
                return (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{FILE_LABELS[file.file_type]}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Other lessons in this module */}
        {currentModule && currentModule.lessons.length > 1 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Aulas deste módulo
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
              {currentModule.lessons.map((ls) => {
                const isCurrent = ls.id === lessonId;
                const isDone = completedIds.has(ls.id);
                return (
                  <Link
                    key={ls.id}
                    href={`/dashboard/aulas/${ls.id}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isCurrent ? "bg-[#CC0000]/5" : "hover:bg-gray-50"
                    }`}
                  >
                    {ls.thumbnail_url ? (
                      <img
                        src={ls.thumbnail_url}
                        alt={ls.title}
                        className="h-9 w-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCurrent ? "bg-[#CC0000]/10" : "bg-gray-100"
                        }`}
                      >
                        <Play
                          className={`h-3.5 w-3.5 ${isCurrent ? "text-[#CC0000]" : "text-gray-400"}`}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate font-medium ${
                        isCurrent ? "text-[#CC0000]" : isDone ? "text-gray-400" : "text-gray-800"
                      }`}>
                        {ls.title}
                      </p>
                      {ls.duration_minutes && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {ls.duration_minutes} min
                        </span>
                      )}
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        Agora
                      </span>
                    ) : isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-[#CC0000] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-200 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
