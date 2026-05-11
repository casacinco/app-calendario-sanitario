import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, FileText, FileSpreadsheet, ImageIcon, File, ExternalLink } from "lucide-react";
import { getEnv } from "@/lib/cf";
import { getUserById, getPublishedLesson, getLessonFiles } from "@/lib/db";
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
  const [user, lesson] = await Promise.all([
    getUserById(db, Number(uid)),
    getPublishedLesson(db, lessonId),
  ]);

  if (!user) redirect("/auth");
  if (!lesson) notFound();

  const files = await getLessonFiles(db, lessonId);

  const ytId = lesson.video_url ? getYouTubeId(lesson.video_url) : null;

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">

      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-white/20 text-sm">|</span>
          <p className="text-sm text-white/70 truncate">{lesson.module_title}</p>
        </div>
      </header>

      <LessonTracker lessonId={lessonId} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Video */}
        {lesson.video_url && (
          <div className="rounded-xl overflow-hidden aspect-video bg-black">
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

        {/* Thumbnail (when no video) */}
        {!lesson.video_url && lesson.thumbnail_url && (
          <div className="rounded-xl overflow-hidden aspect-video">
            <img
              src={lesson.thumbnail_url}
              alt={lesson.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & meta */}
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-white leading-snug">{lesson.title}</h1>
          {lesson.duration_minutes && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
              <Clock className="h-3.5 w-3.5" />
              {lesson.duration_minutes} min
            </span>
          )}
          {lesson.description && (
            <p className="text-sm text-white/60 leading-relaxed pt-1">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Materials */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
              Materiais de apoio
            </h2>
            <div className="rounded-xl border border-white/8 bg-[hsl(var(--card))] overflow-hidden divide-y divide-white/5">
              {files.map((file) => {
                const Icon = FILE_ICONS[file.file_type] ?? File;
                return (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <Icon className="h-4 w-4 text-white/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{file.name}</p>
                      <p className="text-[10px] text-white/30">{FILE_LABELS[file.file_type]}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
