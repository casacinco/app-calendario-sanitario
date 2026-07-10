import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Clock, CheckCircle2, ArrowRightLeft, Wrench, LogOut, CalendarDays, Bell,
  ChevronRight, BarChart3,
} from "lucide-react";
import { getEnv } from "@/lib/cf";
import {
  getUserById,
  listActiveBannersByPlacement,
  getSetting,
} from "@/lib/db";
import { formatDateBR } from "@/lib/format";
import { PlacementBanners } from "@/components/producer/placement-banners";
import { CentralDeManejo } from "@/components/producer/central-manejo";
import { getEventCounts } from "@/lib/calendar-events";
import type { RequestStatus, SolicitationType, MigrationStatus } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface RequestRow {
  id: number;
  status: RequestStatus;
  solicitation_type: SolicitationType;
  migration_status: MigrationStatus | null;
  estimated_delivery_date: string | null;
  deadline: string | null;
  cal_status: string | null;
  cal_id: number | null;
  first_viewed_at: string | null;
  central_management_enabled: number;
  central_management_subscription_status: string;
}

const MIGRATION_LABEL: Record<MigrationStatus, string> = {
  awaiting_migration: "Aguardando início",
  in_migration:       "Em transferência",
  internal_review:    "Em revisão final",
  published:          "Disponível",
  delivered:          "Entregue",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const db = getEnv().DB;
  const user = await getUserById(db, Number(uid));
  if (!user) redirect("/auth");

  const request = await db
    .prepare(
      `SELECT cr.id, cr.status, cr.solicitation_type, cr.migration_status,
              cr.estimated_delivery_date, cr.deadline, cr.first_viewed_at,
              cr.central_management_enabled, cr.central_management_subscription_status,
              c.status AS cal_status, c.id AS cal_id
       FROM calendar_requests cr
       LEFT JOIN calendars c ON c.request_id = cr.id
       WHERE cr.user_id = ?1
       ORDER BY cr.created_at DESC
       LIMIT 1`,
    )
    .bind(Number(uid))
    .first<RequestRow>();

  const firstName   = user.name.split(" ")[0];
  const isMigration = request?.solicitation_type === "migration";
  const migStatus   = request?.migration_status ?? null;
  const migDone     = migStatus === "published" || migStatus === "delivered";
  const isDelivered = request?.status === "delivered" || migDone;
  const firstViewed = !!request?.first_viewed_at;
  const calPublished = request?.cal_status === "published";
  const centralEnabled = !!request?.central_management_enabled;
  const centralState = !isDelivered || !calPublished ? "producing" : centralEnabled ? "active" : "preview";

  const [banners, contentBannerUrl, counts] = await Promise.all([
    listActiveBannersByPlacement(db, "home"),
    getSetting(db, "content_home_banner_url"),
    (isDelivered && calPublished) ? getEventCounts(db, Number(uid)) : Promise.resolve(null),
  ]);

  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-[#111111] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo-rb.png" alt="Rebanho Blindado" width={36} height={36}
              style={{ width: 36, height: "auto", borderRadius: 6, flexShrink: 0 }} priority />
            <div className="hidden sm:block">
              <p className="text-xs text-white/40 leading-none">Olá,</p>
              <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
            </div>
            <p className="text-sm text-white/70 sm:hidden">Olá, <span className="font-semibold text-white">{firstName}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Notificações">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs transition-colors">
                <LogOut className="h-3.5 w-3.5" />Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── 1. Card do calendário ─────────────────────────────────────────── */}

        {request && isDelivered && !firstViewed && (
          /* Primeira vez: CTA para abrir */
          <div className="rounded-2xl overflow-hidden shadow-sm bg-[#111111]">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-[#CC0000]" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Seu calendário</p>
                  <h2 className="text-base font-bold text-white leading-tight">Calendário disponível!</h2>
                </div>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                Seu calendário sanitário personalizado está pronto e disponível para uso.
              </p>
              <Link href="/api/dashboard/calendar/viewed"
                className="block w-full py-3 rounded-xl bg-[#CC0000] text-white text-sm font-bold text-center hover:bg-[#AA0000] transition-colors">
                Abrir Calendário
              </Link>
            </div>
          </div>
        )}

        {request && isDelivered && firstViewed && (
          /* Acesso rápido ao calendário */
          <Link href="/dashboard/calendario"
            className="flex items-center justify-between bg-[#111111] rounded-2xl p-4 shadow-sm hover:bg-[#1a1a1a] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-5 w-5 text-[#CC0000]" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium leading-none">Calendário sanitário</p>
                <p className="text-sm font-bold text-white leading-tight mt-0.5">Abrir Calendário</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30 flex-shrink-0" />
          </Link>
        )}

        {request && !isDelivered && (
          /* Progresso / migração */
          <div className="rounded-2xl overflow-hidden shadow-sm bg-[#111111]">
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {isMigration ? (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <ArrowRightLeft className="h-5 w-5 text-white/70" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-[#CC0000]" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                      {isMigration ? "Migração de calendário" : "Seu calendário"}
                    </p>
                    <h2 className="text-base font-bold text-white leading-tight">
                      {isMigration ? "Em transferência" : "Em produção"}
                    </h2>
                  </div>
                </div>
                {isMigration && migStatus && !migDone && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/15 whitespace-nowrap">
                    {MIGRATION_LABEL[migStatus]}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                {isMigration
                  ? "Nossa equipe irá localizar o PDF do seu calendário existente, transcrevê-lo e publicá-lo aqui para você."
                  : "Recebemos suas informações e nossa equipe já está trabalhando na criação do seu calendário sanitário personalizado."}
              </p>
              {(isMigration ? request.estimated_delivery_date : request.deadline) && (
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 w-fit">
                  <CalendarDays className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-xs text-white/50">
                    Previsão:{" "}
                    <span className="text-white font-semibold">
                      {formatDateBR(isMigration ? request.estimated_delivery_date : request.deadline)}
                    </span>
                  </span>
                </div>
              )}
            </div>
            {isMigration && !migDone && migStatus && (
              <div className="bg-white/5 px-5 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-white/30">Progresso</span>
                  <span className="text-[10px] text-white/30">
                    {migStatus === "awaiting_migration" ? "1/4" : migStatus === "in_migration" ? "2/4" : migStatus === "internal_review" ? "3/4" : "4/4"}
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#CC0000] rounded-full transition-all" style={{
                    width: migStatus === "awaiting_migration" ? "25%" : migStatus === "in_migration" ? "50%" : migStatus === "internal_review" ? "75%" : "100%",
                  }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  {["Aguardando", "Transferindo", "Revisão", "Publicado"].map((step, i) => {
                    const idx = ["awaiting_migration","in_migration","internal_review","published"].indexOf(migStatus ?? "");
                    return <span key={step} className={`text-[9px] ${i <= idx ? "text-white/50" : "text-white/20"}`}>{step}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 2. Central de Manejo ──────────────────────────────────────────── */}
        <CentralDeManejo state={centralState} counts={counts} />

        {/* ── 4. Banner conteúdos ───────────────────────────────────────────── */}
        <Link href="/dashboard/conteudos" className="block rounded-2xl overflow-hidden shadow-sm focus:outline-none">
          {contentBannerUrl ? (
            <div className="relative aspect-[16/9]">
              <img src={contentBannerUrl} alt="Conteúdos Técnicos Exclusivos" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block px-4 py-2.5 rounded-xl bg-[#CC0000] text-white text-sm font-bold shadow-lg">
                  Acessar conteúdos
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#111111] p-5 space-y-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Área exclusiva</p>
                <h2 className="text-base font-bold text-white leading-tight">Conteúdos Técnicos Exclusivos</h2>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                Aprenda manejos sanitários, boas práticas e protocolos com os especialistas do Rebanho Blindado.
              </p>
              <span className="inline-block px-4 py-2.5 rounded-xl bg-[#CC0000] text-white text-sm font-bold">
                Acessar conteúdos
              </span>
            </div>
          )}
        </Link>

        {/* ── Banners comerciais ────────────────────────────────────────────── */}
        <PlacementBanners banners={banners} />

        {/* ── 5. Ferramentas ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Ferramentas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/dashboard/ferramentas"
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-[#CC0000]/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-4.5 w-4.5 text-[#CC0000]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">Calculadora</p>
                <p className="text-[10px] text-gray-400">Doses e custos</p>
              </div>
            </Link>
            <Link href="/dashboard/historico"
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4.5 w-4.5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">Histórico</p>
                <p className="text-[10px] text-gray-400">Manejos e eventos</p>
              </div>
            </Link>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 opacity-60">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">Indicadores</p>
                <p className="text-[10px] text-gray-400">Em breve</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
