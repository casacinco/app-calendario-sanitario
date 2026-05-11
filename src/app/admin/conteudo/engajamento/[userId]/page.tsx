import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Clock, BookCheck, Activity, TrendingUp, LogIn, Play, CheckCircle2, Download } from "lucide-react";
import { getEnv } from "@/lib/cf";
import type { EngagementLevel } from "@/components/content/engagement-overview";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type UserStatsRow = {
  id: number; name: string; email: string; subscription_type: string; created_at: string;
  completed_count: number; total_accesses: number;
  last_accessed_at: string | null;
  current_lesson_title: string | null;
  first_login: string | null;
};

type LessonRow = {
  lesson_title: string;
  module_title: string;
  completed_at: string | null;
  last_accessed_at: string | null;
};

type EventRow = {
  event_type: string;
  lesson_title: string | null;
  created_at: string;
};

function calcEngagement(last: string | null, accesses: number): EngagementLevel {
  if (!last || accesses === 0) return "Nenhum";
  const days = (Date.now() - new Date(last).getTime()) / 86400000;
  if (days > 14) return "Baixo";
  if (days > 3)  return "Médio";
  return "Alto";
}

const ENG_COLOR: Record<EngagementLevel, string> = {
  Nenhum: "text-text-muted bg-text/5",
  Baixo:  "text-amber-400 bg-amber-400/10",
  Médio:  "text-blue-400 bg-blue-400/10",
  Alto:   "text-[hsl(var(--green))] bg-[hsl(var(--green))]/10",
};

const EVENT_ICON: Record<string, typeof Play> = {
  login:              LogIn,
  lesson_viewed:      Play,
  lesson_completed:   CheckCircle2,
  material_downloaded: Download,
};

const EVENT_LABEL: Record<string, string> = {
  login:               "Login",
  lesson_viewed:       "Aula acessada",
  lesson_completed:    "Aula concluída",
  material_downloaded: "Material baixado",
};

function fmtDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const uid = Number(userId);
  if (!uid) notFound();

  const db = getEnv().DB;

  const [statsRow, lessonsRes, totalRes, eventsRes] = await Promise.all([
    db
      .prepare(
        `SELECT u.id, u.name, u.email, u.subscription_type, u.created_at,
                COALESCE(SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END), 0) AS completed_count,
                COALESCE(SUM(lp.access_count), 0) AS total_accesses,
                MAX(lp.last_accessed_at) AS last_accessed_at,
                (
                  SELECT l.title FROM lesson_progress lp2
                  JOIN content_lessons l ON l.id = lp2.lesson_id
                  WHERE lp2.user_id = u.id ORDER BY lp2.last_accessed_at DESC LIMIT 1
                ) AS current_lesson_title,
                (
                  SELECT ue.created_at FROM user_events ue
                  WHERE ue.user_id = u.id AND ue.event_type = 'login'
                  ORDER BY ue.created_at ASC LIMIT 1
                ) AS first_login
           FROM users u
           LEFT JOIN lesson_progress lp ON lp.user_id = u.id
          WHERE u.id = ?1 AND u.role = 'user'
          GROUP BY u.id`,
      )
      .bind(uid)
      .first<UserStatsRow>(),
    db
      .prepare(
        `SELECT l.title AS lesson_title, m.title AS module_title,
                lp.completed_at, lp.last_accessed_at
           FROM lesson_progress lp
           JOIN content_lessons l ON l.id = lp.lesson_id
           JOIN content_modules m ON m.id = l.module_id
          WHERE lp.user_id = ?1
          ORDER BY lp.completed = 1 DESC, lp.last_accessed_at DESC`,
      )
      .bind(uid)
      .all<LessonRow>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM content_lessons WHERE status = 'published'`)
      .first<{ n: number }>(),
    db
      .prepare(
        `SELECT ue.event_type, ue.created_at, l.title AS lesson_title
           FROM user_events ue
           LEFT JOIN content_lessons l ON l.id = ue.lesson_id
          WHERE ue.user_id = ?1
          ORDER BY ue.created_at DESC
          LIMIT 50`,
      )
      .bind(uid)
      .all<EventRow>(),
  ]);

  if (!statsRow) notFound();

  const totalLessons  = totalRes?.n ?? 0;
  const progressPct   = totalLessons > 0 ? Math.round((statsRow.completed_count / totalLessons) * 100) : 0;
  const engagement    = calcEngagement(statsRow.last_accessed_at, statsRow.total_accesses);

  const completed   = lessonsRes.results.filter((l) => l.completed_at !== null);
  const incomplete  = lessonsRes.results.filter((l) => l.completed_at === null);

  const STATS = [
    { label: "Progresso",         value: `${progressPct}%` },
    { label: "Aulas concluídas",  value: `${statsRow.completed_count} de ${totalLessons}` },
    { label: "Total de acessos",  value: String(statsRow.total_accesses) },
    { label: "Último acesso",     value: fmtDate(statsRow.last_accessed_at) },
    { label: "Aula atual",        value: statsRow.current_lesson_title ?? "—" },
    { label: "Primeiro acesso",   value: fmtDate(statsRow.first_login) },
  ];

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back */}
      <Link
        href="/admin/conteudo/engajamento"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao engajamento
      </Link>

      {/* User header */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
        <div className="h-11 w-11 rounded-full bg-text/10 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-text leading-tight">{statsRow.name}</h1>
          <p className="text-sm text-text-muted">{statsRow.email}</p>
          <p className="text-xs text-text-muted/60 capitalize mt-0.5">{statsRow.subscription_type}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ENG_COLOR[engagement]}`}>
          {engagement}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {STATS.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-text truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Progresso geral</span>
          <span className="font-medium text-text">{progressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-text/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(var(--green))] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Completed lessons */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <BookCheck className="h-4 w-4 text-[hsl(var(--green))]" />
          Aulas concluídas
          <span className="text-xs font-normal text-text-muted">({completed.length})</span>
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {completed.length === 0 ? (
            <p className="px-4 py-4 text-sm text-text-muted/50 italic">Nenhuma aula concluída ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs">
                  <th className="px-4 py-2.5 text-left font-medium">Módulo</th>
                  <th className="px-4 py-2.5 text-left font-medium">Aula</th>
                  <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">Concluída em</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((l, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-text-muted text-xs">{l.module_title}</td>
                    <td className="px-4 py-2.5 text-text text-xs">{l.lesson_title}</td>
                    <td className="px-4 py-2.5 text-text-muted text-xs whitespace-nowrap">{fmtDate(l.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Incomplete lessons */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Aulas não concluídas
          <span className="text-xs font-normal text-text-muted">({incomplete.length})</span>
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {incomplete.length === 0 ? (
            <p className="px-4 py-4 text-sm text-text-muted/50 italic">Todas as aulas acessadas foram concluídas.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs">
                  <th className="px-4 py-2.5 text-left font-medium">Módulo</th>
                  <th className="px-4 py-2.5 text-left font-medium">Aula</th>
                  <th className="px-4 py-2.5 text-left font-medium">Último acesso</th>
                </tr>
              </thead>
              <tbody>
                {incomplete.map((l, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-text-muted text-xs">{l.module_title}</td>
                    <td className="px-4 py-2.5 text-text text-xs">{l.lesson_title}</td>
                    <td className="px-4 py-2.5 text-text-muted text-xs">{fmtDate(l.last_accessed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Event history */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-muted" />
          Histórico de atividades
          <span className="text-xs font-normal text-text-muted">(últimas {eventsRes.results.length})</span>
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
          {eventsRes.results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-text-muted/50 italic">Nenhuma atividade registrada.</p>
          ) : (
            eventsRes.results.map((ev, i) => {
              const Icon  = EVENT_ICON[ev.event_type]  ?? Activity;
              const label = EVENT_LABEL[ev.event_type] ?? ev.event_type;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <Icon className="h-3.5 w-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text font-medium">{label}</p>
                    {ev.lesson_title && (
                      <p className="text-[10px] text-text-muted truncate">{ev.lesson_title}</p>
                    )}
                  </div>
                  <time className="text-[10px] text-text-muted/60 whitespace-nowrap flex-shrink-0">
                    {fmtDateTime(ev.created_at)}
                  </time>
                </div>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}
