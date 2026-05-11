import { getEnv } from "@/lib/cf";
import {
  EngagementOverview,
  type EngagementUser,
  type EngagementMetrics,
  type EngagementLevel,
} from "@/components/content/engagement-overview";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type UserProgressRow = {
  id: number;
  name: string;
  email: string;
  subscription_type: string;
  completed_count: number;
  total_accesses: number;
  last_accessed_at: string | null;
  current_lesson_title: string | null;
};

function calcEngagement(last: string | null, accesses: number): EngagementLevel {
  if (!last || accesses === 0) return "Nenhum";
  const days = (Date.now() - new Date(last).getTime()) / 86400000;
  if (days > 14) return "Baixo";
  if (days > 3)  return "Médio";
  return "Alto";
}

export default async function EngajamentoPage() {
  const db = getEnv().DB;

  const [usersRes, lessonsRes] = await Promise.all([
    db
      .prepare(
        `SELECT
           u.id, u.name, u.email, u.subscription_type,
           COALESCE(SUM(CASE WHEN lp.completed = 1 THEN 1 ELSE 0 END), 0) AS completed_count,
           COALESCE(SUM(lp.access_count), 0)                               AS total_accesses,
           MAX(lp.last_accessed_at)                                        AS last_accessed_at,
           (
             SELECT l.title
               FROM lesson_progress lp2
               JOIN content_lessons l ON l.id = lp2.lesson_id
              WHERE lp2.user_id = u.id
              ORDER BY lp2.last_accessed_at DESC
              LIMIT 1
           ) AS current_lesson_title
         FROM users u
         LEFT JOIN lesson_progress lp ON lp.user_id = u.id
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY COALESCE(MAX(lp.last_accessed_at), '0000') DESC`,
      )
      .all<UserProgressRow>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM content_lessons WHERE status = 'published'`)
      .first<{ n: number }>(),
  ]);

  const totalLessons = lessonsRes?.n ?? 0;

  const users: EngagementUser[] = usersRes.results.map((u) => {
    const progress_pct = totalLessons > 0
      ? Math.round((u.completed_count / totalLessons) * 100)
      : 0;
    return { ...u, progress_pct, engagement: calcEngagement(u.last_accessed_at, u.total_accesses) };
  });

  const total = users.length;
  const avg_progress    = total > 0 ? Math.round(users.reduce((s, u) => s + u.progress_pct, 0) / total) : 0;
  const completed_all   = users.filter((u) => u.progress_pct === 100).length;
  const avg_completion  = total > 0 ? Math.round((completed_all / total) * 100) : 0;
  const inactive_count  = users.filter((u) => u.engagement === "Nenhum" || u.engagement === "Baixo").length;

  const ENG_SCORE: Record<EngagementLevel, number> = { Nenhum: 0, Baixo: 1, Médio: 2, Alto: 3 };
  const avgScore     = total > 0 ? users.reduce((s, u) => s + ENG_SCORE[u.engagement], 0) / total : 0;
  const avg_engagement: EngagementLevel =
    avgScore < 0.5 ? "Nenhum" : avgScore < 1.5 ? "Baixo" : avgScore < 2.5 ? "Médio" : "Alto";

  const metrics: EngagementMetrics = {
    total_users: total, avg_progress, avg_completion, avg_engagement, inactive_count, total_lessons: totalLessons,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-text">Engajamento</h1>
        <p className="text-sm text-text-muted">
          Consumo de aulas e progresso dos usuários na plataforma.
        </p>
      </div>
      <EngagementOverview users={users} metrics={metrics} />
    </div>
  );
}
