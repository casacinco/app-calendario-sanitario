"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronRight, ChevronLeft, Users, TrendingUp, Activity, Clock, BookCheck,
} from "lucide-react";

const PAGE_SIZE = 15;

export type EngagementLevel = "Nenhum" | "Baixo" | "Médio" | "Alto";

export interface EngagementUser {
  id: number;
  name: string;
  email: string;
  subscription_type: string;
  last_accessed_at: string | null;
  completed_count: number;
  total_accesses: number;
  current_lesson_title: string | null;
  progress_pct: number;
  engagement: EngagementLevel;
}

export interface EngagementMetrics {
  total_users: number;
  avg_progress: number;
  avg_completion: number;
  avg_engagement: EngagementLevel;
  inactive_count: number;
  total_lessons: number;
}

interface Props {
  users: EngagementUser[];
  metrics: EngagementMetrics;
}

const ENG_COLOR: Record<EngagementLevel, string> = {
  Nenhum: "text-text-muted",
  Baixo:  "text-amber-400",
  Médio:  "text-blue-400",
  Alto:   "text-[hsl(var(--green))]",
};

function fmtDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function EngagementOverview({ users, metrics }: Props) {
  const router   = useRouter();
  const [search,    setSearch]    = useState("");
  const [filterEng, setFilterEng] = useState("todos");
  const [page,      setPage]      = useState(1);

  const filtered = users.filter((u) => {
    const q   = search.toLowerCase();
    const hit = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const eng = filterEng === "todos" || u.engagement === filterEng;
    return hit && eng;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  function handleFilterChange(eng: string) {
    setFilterEng(eng);
    setPage(1);
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
  }

  const CARDS = [
    { label: "Total de usuários",    value: String(metrics.total_users),         sub: "cadastrados na plataforma",     icon: Users },
    { label: "Conclusão",            value: `${metrics.avg_completion}%`,         sub: "concluíram todas as aulas",     icon: BookCheck },
    { label: "Progresso médio",      value: `${metrics.avg_progress}%`,           sub: "média de aulas concluídas",     icon: TrendingUp },
    { label: "Engajamento médio",    value: metrics.avg_engagement,               sub: "baseado na recência de acesso", icon: Activity },
    { label: "Sem acesso recente",   value: String(metrics.inactive_count),       sub: "inativos ou nunca acessaram",   icon: Clock },
  ] as const;

  return (
    <div className="space-y-5">

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {CARDS.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider">
              <Icon className="h-3 w-3" />
              {label}
            </div>
            <p className="text-xl font-bold text-text">{value}</p>
            <p className="text-[10px] text-text-muted leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-border"
          />
        </div>
        <select
          value={filterEng}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-border"
        >
          <option value="todos">Todos</option>
          <option value="Alto">Alto</option>
          <option value="Médio">Médio</option>
          <option value="Baixo">Baixo</option>
          <option value="Nenhum">Nenhum</option>
        </select>
      </div>

      {/* Table + pagination */}
      <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs">
              <th className="px-4 py-3 text-left font-medium">Usuário</th>
              <th className="px-4 py-3 text-left font-medium">Último acesso</th>
              <th className="px-4 py-3 text-left font-medium">Engajamento</th>
              <th className="px-4 py-3 text-left font-medium">Progresso</th>
              <th className="px-4 py-3 text-left font-medium">Concluídas</th>
              <th className="px-4 py-3 text-left font-medium">Aula atual</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted text-sm">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              paginated.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => router.push(`/admin/conteudo/engajamento/${u.id}`)}
                  className="border-b border-border/50 last:border-0 hover:bg-text/[0.03] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text leading-tight">{u.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{u.email}</p>
                    <p className="text-[10px] text-text-muted/50 mt-0.5 capitalize">{u.subscription_type}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                    {fmtDate(u.last_accessed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${ENG_COLOR[u.engagement]}`}>
                      {u.engagement}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-text/10 overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--green))]"
                          style={{ width: `${u.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">{u.progress_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                    {u.completed_count} de {metrics.total_lessons}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted max-w-[180px]">
                    <span className="truncate block">{u.current_lesson_title ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-text-muted/30" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-text-muted">
            {filtered.length} usuário{filtered.length !== 1 ? "s" : ""} ·{" "}
            página {safePage} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => changePage(safePage - 1)}
              disabled={safePage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text hover:bg-text/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-text-muted">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => changePage(p)}
                      className={`min-w-[32px] px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                        p === safePage
                          ? "border-text/30 bg-text/10 text-text font-medium"
                          : "border-border text-text-muted hover:text-text hover:bg-text/5"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
            </div>

            <button
              onClick={() => changePage(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text hover:bg-text/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
