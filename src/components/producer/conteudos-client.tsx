"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play, FileText, FileSpreadsheet, ImageIcon, File, BookOpen,
  ChevronDown, ChevronRight, CheckCircle2, Clock, ExternalLink,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type FileType = "pdf" | "spreadsheet" | "image" | "document" | "other";

export type LessonFile = {
  id: number;
  lesson_id: number;
  name: string;
  url: string;
  file_type: FileType;
};

export type ClientLesson = {
  id: number;
  module_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  files: LessonFile[];
};

export type ClientModule = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  accent_color: string;
  lessons: ClientLesson[];
};

export type ConteudosClientProps = {
  modules: ClientModule[];
  completedIds: number[];
  initialLesson: ClientLesson | null;
  isFirstAccess: boolean;
};

// ── Helpers ────────────────────────────────────────────────────────────────

// Set to a YouTube URL when the welcome video is ready
const WELCOME_VIDEO_URL: string | null = null;

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/,
  );
  return m?.[1] ?? null;
}

const FILE_ICON: Record<FileType, React.ComponentType<{ className?: string }>> = {
  pdf:         FileText,
  spreadsheet: FileSpreadsheet,
  image:       ImageIcon,
  document:    FileText,
  other:       File,
};

const FILE_LABEL: Record<FileType, string> = {
  pdf:         "PDF",
  spreadsheet: "Planilha",
  image:       "Imagem",
  document:    "Documento",
  other:       "Arquivo",
};

const FILE_ACTION: Record<FileType, string> = {
  pdf:         "Abrir",
  spreadsheet: "Abrir",
  image:       "Visualizar",
  document:    "Abrir",
  other:       "Baixar",
};

function getLessonIcon(lesson: ClientLesson, isCurrent: boolean) {
  const cls = `h-4 w-4 ${isCurrent ? "text-white" : "text-gray-400"}`;
  if (lesson.video_url) return <Play className={cls} />;
  if (lesson.files.length > 0) {
    const firstFile = lesson.files[0];
    const Icon = firstFile ? (FILE_ICON[firstFile.file_type] ?? File) : File;
    return <Icon className={cls} />;
  }
  return <BookOpen className={cls} />;
}

function getLessonTypeLabel(lesson: ClientLesson): string {
  if (lesson.video_url) {
    return `Assistir${lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ""}`;
  }
  if (lesson.files.length > 0) {
    const type = lesson.files[0]?.file_type;
    if (type === "pdf") return "Abrir PDF";
    if (type === "spreadsheet") return "Abrir Planilha";
    if (type === "image") return "Ver Imagem";
    return "Baixar Material";
  }
  return "Material";
}

function trackProgress(lessonId: number, completed = false) {
  fetch("/api/progress/lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson_id: lessonId, completed }),
  }).catch(() => {});
}

// ── Main component ─────────────────────────────────────────────────────────

export function ConteudosClient({
  modules,
  completedIds,
  initialLesson,
  isFirstAccess,
}: ConteudosClientProps) {
  const [currentLesson, setCurrentLesson] = useState<ClientLesson | null>(initialLesson);
  const [openModuleId, setOpenModuleId] = useState<number | null>(
    initialLesson?.module_id ?? modules[0]?.id ?? null,
  );
  const [completedSet, setCompletedSet] = useState(() => new Set(completedIds));
  const [showWelcome, setShowWelcome] = useState(isFirstAccess);

  // Track initial lesson on mount to update last_accessed_at
  useEffect(() => {
    if (initialLesson) trackProgress(initialLesson.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectLesson = useCallback((lesson: ClientLesson) => {
    setCurrentLesson(lesson);
    setOpenModuleId(lesson.module_id);
    setShowWelcome(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackProgress(lesson.id);
  }, []);

  const markCompleted = useCallback(() => {
    if (!currentLesson || completedSet.has(currentLesson.id)) return;
    const id = currentLesson.id;
    setCompletedSet((prev) => new Set([...prev, id]));
    trackProgress(id, true);
  }, [currentLesson, completedSet]);

  const toggleModule = useCallback((moduleId: number) => {
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId));
  }, []);

  // ── Player ───────────────────────────────────────────────────────────────

  const renderPlayer = () => {
    // Welcome video takes priority on first access
    if (showWelcome && WELCOME_VIDEO_URL) {
      const ytId = getYouTubeId(WELCOME_VIDEO_URL);
      return ytId ? (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title="Boas-vindas"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <video src={WELCOME_VIDEO_URL} controls className="w-full h-full" />
      );
    }

    if (!currentLesson) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <BookOpen className="h-12 w-12 text-white/20" />
          <p className="text-sm text-white/30">Selecione uma aula abaixo</p>
        </div>
      );
    }

    const ytId = currentLesson.video_url ? getYouTubeId(currentLesson.video_url) : null;

    if (ytId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title={currentLesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      );
    }

    if (currentLesson.video_url) {
      return (
        <video
          src={currentLesson.video_url}
          controls
          className="w-full h-full"
          poster={currentLesson.thumbnail_url ?? undefined}
        />
      );
    }

    if (currentLesson.thumbnail_url) {
      return (
        <img
          src={currentLesson.thumbnail_url}
          alt={currentLesson.title}
          className="w-full h-full object-cover"
        />
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <BookOpen className="h-12 w-12 text-white/20" />
        <p className="text-xs text-white/30">Material disponível abaixo</p>
      </div>
    );
  };

  // The "active" lesson shown in the info panel (null when showing welcome video)
  const activeLesson = showWelcome && WELCOME_VIDEO_URL ? null : currentLesson;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Welcome banner — first access only */}
      {showWelcome && (
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <div className="bg-[#111111] rounded-t-2xl px-4 pt-4 pb-0">
            <span className="inline-block text-[10px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Importante
            </span>
            <h3 className="text-base font-bold text-white mt-2 leading-snug">
              Antes de começar
            </h3>
            <p className="text-sm text-white/55 mt-1 pb-4 leading-relaxed">
              Assista este vídeo rápido para entender como utilizar os conteúdos
              e aproveitar melhor o aplicativo.
            </p>
          </div>
        </div>
      )}

      {/* Player */}
      <div className={showWelcome ? "max-w-2xl mx-auto px-4" : ""}>
        <div className={`bg-black aspect-video w-full ${showWelcome ? "rounded-b-2xl overflow-hidden" : ""}`}>
          {renderPlayer()}
        </div>
      </div>

      {/* Lesson info panel */}
      {activeLesson && (
        <div className="bg-white shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

            <h1 className="text-base font-bold text-gray-900 leading-snug">
              {activeLesson.title}
            </h1>

            {activeLesson.duration_minutes && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {activeLesson.duration_minutes} min
              </span>
            )}

            {activeLesson.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {activeLesson.description}
              </p>
            )}

            {/* Downloadable materials */}
            {activeLesson.files.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Materiais
                </p>
                {activeLesson.files.map((file) => {
                  const Icon = FILE_ICON[file.file_type] ?? File;
                  return (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-[#CC0000]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {FILE_LABEL[file.file_type]} · {FILE_ACTION[file.file_type]}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Mark as completed */}
            <div className="pt-1 pb-1">
              {completedSet.has(activeLesson.id) ? (
                <div className="flex items-center gap-2 text-[#CC0000]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Aula concluída</span>
                </div>
              ) : (
                <button
                  onClick={markCompleted}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#CC0000] active:text-[#CC0000] transition-colors"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
                  <span className="text-sm font-medium">Marcar como concluída</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modules accordion */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {modules.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-900">Conteúdos em breve</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
              Novos módulos sobre manejo sanitário serão disponibilizados aqui em breve.
            </p>
          </div>
        ) : (
          modules.map((mod) => {
            const isOpen = openModuleId === mod.id;
            const completedCount = mod.lessons.filter((l) => completedSet.has(l.id)).length;
            const progress = mod.lessons.length > 0 ? completedCount / mod.lessons.length : 0;

            return (
              <div key={mod.id} className="rounded-2xl overflow-hidden shadow-sm">

                {/* Module banner */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="relative w-full text-left"
                  style={{ minHeight: 104 }}
                >
                  {/* Background */}
                  <div className="absolute inset-0">
                    {mod.thumbnail_url ? (
                      <img
                        src={mod.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#111111]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
                  </div>

                  {/* Content overlay */}
                  <div className="relative z-10 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-0.5">
                          {mod.lessons.length} aula{mod.lessons.length !== 1 ? "s" : ""}
                          {completedCount > 0 && ` · ${completedCount} concluída${completedCount !== 1 ? "s" : ""}`}
                        </p>
                        <h3 className="text-base font-bold text-white leading-snug">
                          {mod.title}
                        </h3>
                        {mod.description && (
                          <p className="text-xs text-white/50 mt-1 line-clamp-1">
                            {mod.description}
                          </p>
                        )}
                      </div>
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isOpen ? "bg-white/20" : "bg-white/10"
                      }`}>
                        <ChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    {completedCount > 0 && (
                      <div className="mt-3">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#CC0000] rounded-full transition-all duration-500"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 text-right">
                          {Math.round(progress * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </button>

                {/* Lesson list */}
                {isOpen && (
                  <div className="bg-white divide-y divide-gray-50">
                    {mod.lessons.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400 italic">
                        Nenhuma aula disponível ainda.
                      </p>
                    ) : (
                      mod.lessons.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isDone = completedSet.has(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={`relative flex items-center gap-3 w-full text-left px-4 py-3.5 transition-colors ${
                              isCurrent
                                ? "bg-[#CC0000]/5"
                                : "hover:bg-gray-50 active:bg-gray-100"
                            }`}
                          >
                            {/* Active indicator */}
                            {isCurrent && (
                              <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#CC0000]" />
                            )}

                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isCurrent ? "bg-[#CC0000]" : "bg-gray-100"
                            }`}>
                              {getLessonIcon(lesson, isCurrent)}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-snug truncate ${
                                isCurrent
                                  ? "text-[#CC0000]"
                                  : isDone
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}>
                                {lesson.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {getLessonTypeLabel(lesson)}
                              </p>
                            </div>

                            {/* Status */}
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-[#CC0000] flex-shrink-0" />
                            ) : isCurrent ? (
                              <span className="text-[10px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                                Agora
                              </span>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-200 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
