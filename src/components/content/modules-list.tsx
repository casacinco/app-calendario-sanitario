"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Play, Clock, BookOpen } from "lucide-react";
import type { PublishedModule } from "@/lib/db";

interface Props {
  modules: PublishedModule[];
}

export function ModulesList({ modules }: Props) {
  const [openId, setOpenId] = useState<number | null>(modules[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {modules.map((mod) => (
        <div
          key={mod.id}
          className="rounded-xl border border-white/8 bg-[hsl(var(--card))] overflow-hidden"
        >
          <button
            onClick={() => setOpenId(openId === mod.id ? null : mod.id)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
          >
            {mod.thumbnail_url ? (
              <img
                src={mod.thumbnail_url}
                alt={mod.title}
                className="h-10 w-16 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-md flex-shrink-0 flex items-center justify-center"
                style={{ background: `${mod.accent_color}33` }}
              >
                <BookOpen className="h-4 w-4" style={{ color: mod.accent_color }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{mod.title}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {mod.lessons.length === 0
                  ? "Nenhuma aula publicada"
                  : `${mod.lessons.length} aula${mod.lessons.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${
                openId === mod.id ? "rotate-180" : ""
              }`}
            />
          </button>

          {openId === mod.id && (
            <div className="border-t border-white/5">
              {mod.lessons.length === 0 ? (
                <p className="px-4 py-3 text-xs text-white/30 italic">
                  Nenhuma aula disponível ainda.
                </p>
              ) : (
                mod.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/aulas/${lesson.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    {lesson.thumbnail_url ? (
                      <img
                        src={lesson.thumbnail_url}
                        alt={lesson.title}
                        className="h-9 w-14 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Play className="h-3.5 w-3.5 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{lesson.title}</p>
                      {lesson.duration_minutes && (
                        <span className="flex items-center gap-1 text-[10px] text-white/30 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {lesson.duration_minutes} min
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
