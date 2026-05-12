"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Play, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import type { PublishedModule } from "@/lib/db";

interface Props {
  modules: PublishedModule[];
  completedIds?: number[];
}

export function ModulesList({ modules, completedIds = [] }: Props) {
  const [openId, setOpenId] = useState<number | null>(modules[0]?.id ?? null);
  const doneSet = new Set(completedIds);

  return (
    <div className="space-y-3">
      {modules.map((mod) => (
        <div key={mod.id} className="rounded-2xl overflow-hidden shadow-sm bg-white">
          <button
            onClick={() => setOpenId(openId === mod.id ? null : mod.id)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
          >
            {mod.thumbnail_url ? (
              <img
                src={mod.thumbnail_url}
                alt={mod.title}
                className="h-10 w-16 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `${mod.accent_color}22` }}
              >
                <BookOpen className="h-4 w-4" style={{ color: mod.accent_color }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{mod.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {mod.lessons.length === 0
                  ? "Nenhuma aula publicada"
                  : `${mod.lessons.length} aula${mod.lessons.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${
                openId === mod.id ? "rotate-180" : ""
              }`}
            />
          </button>

          {openId === mod.id && (
            <div className="border-t border-gray-100">
              {mod.lessons.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 italic">
                  Nenhuma aula disponível ainda.
                </p>
              ) : (
                mod.lessons.map((lesson) => {
                  const done = doneSet.has(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/aulas/${lesson.id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      {lesson.thumbnail_url ? (
                        <img
                          src={lesson.thumbnail_url}
                          alt={lesson.title}
                          className="h-9 w-14 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Play className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${done ? "text-gray-400" : "text-gray-800"}`}>
                          {lesson.title}
                        </p>
                        {lesson.duration_minutes && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {lesson.duration_minutes} min
                          </span>
                        )}
                      </div>
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-[#CC0000] flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-200 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
