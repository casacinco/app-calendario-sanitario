"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PlayCircle, Clock, ExternalLink, ChevronRight } from "lucide-react";
import type { ContentLesson, ContentModule, LessonStatus } from "@/lib/db";

const STATUS_LABEL: Record<LessonStatus, string> = {
  published: "Publicada",
  draft:     "Rascunho",
  hidden:    "Oculta",
};
const STATUS_CLASS: Record<LessonStatus, string> = {
  published: "bg-green/15 text-green border-green/30",
  draft:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hidden:    "bg-text-muted/10 text-text-muted border-border",
};

interface Props {
  initialLessons: ContentLesson[];
  modules: ContentModule[];
}

export function LessonsAll({ initialLessons, modules }: Props) {
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialLessons.filter((l) => {
      if (filterModule !== "all" && String(l.module_id) !== filterModule) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!l.title.toLowerCase().includes(q) && !(l.description ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [initialLessons, filterModule, filterStatus, search]);

  const SELECT = "rounded-md border border-border bg-background text-text px-3 py-2 text-sm focus:outline-none";
  const INPUT = "rounded-md border border-border bg-background text-text px-3 py-2 text-sm focus:outline-none flex-1";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          className={INPUT}
          style={{ maxWidth: 240 }}
          placeholder="Buscar aula…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={SELECT} value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="all">Todos os módulos</option>
          {modules.map((m) => <option key={m.id} value={String(m.id)}>{m.title}</option>)}
        </select>
        <select className={SELECT} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="published">Publicada</option>
          <option value="draft">Rascunho</option>
          <option value="hidden">Oculta</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-muted text-sm py-10 text-center">Nenhuma aula encontrada.</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((lesson) => {
            const mod = modules.find((m) => m.id === lesson.module_id);
            return (
              <div key={lesson.id} className="border border-border rounded-lg bg-card flex items-center gap-3 p-3">
                {lesson.thumbnail_url ? (
                  <img src={lesson.thumbnail_url} alt="" className="h-10 w-16 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="h-10 w-16 rounded bg-text/5 flex items-center justify-center flex-shrink-0">
                    <PlayCircle className="h-5 w-5 text-text-muted" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{lesson.title}</span>
                    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${STATUS_CLASS[lesson.status]}`}>
                      {STATUS_LABEL[lesson.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {mod && (
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mod.accent_color }} />
                        {mod.title}
                      </span>
                    )}
                    {lesson.video_url && <span className="text-[10px] text-text-muted flex items-center gap-1"><PlayCircle className="h-3 w-3" /> Vídeo</span>}
                    {lesson.duration_minutes && <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.duration_minutes}min</span>}
                  </div>
                </div>

                {mod && (
                  <Link
                    href={`/admin/conteudo/modulos/${mod.id}`}
                    className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors flex-shrink-0"
                    title="Ir para o módulo"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-text-muted">
        {filtered.length} de {initialLessons.length} aulas · Para criar ou reordenar, acesse o módulo específico
      </p>

      <div className="pt-2 border-t border-border">
        <h3 className="text-sm font-medium mb-3">Ir para um módulo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/admin/conteudo/modulos/${m.id}`}
              className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-text/5 transition-colors"
            >
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: m.accent_color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs text-text-muted">{m.lesson_count} aulas</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
