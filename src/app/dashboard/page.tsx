import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Clock, CheckCircle2, ArrowRightLeft, ChevronRight,
  BookOpen, Wrench, LogOut, CalendarDays, Bell,
} from "lucide-react";
import { getEnv } from "@/lib/cf";
import {
  getUserById,
  getUserAccess,
  listActiveBanners,
  listPublishedModulesWithLessons,
} from "@/lib/db";
import { formatDateBR } from "@/lib/format";
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
}

const MIGRATION_LABEL: Record<MigrationStatus, string> = {
  awaiting_migration: "Aguardando início",
  in_migration:       "Em transferência",
  internal_review:    "Em revisão final",
  published:          "Disponível",
  delivered:          "Entregue",
};

async function ProducerLogout() {
  "use server";
}

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
              cr.estimated_delivery_date, cr.deadline,
              c.status AS cal_status, c.id AS cal_id
       FROM calendar_requests cr
       LEFT JOIN calendars c ON c.request_id = cr.id
       WHERE cr.user_id = ?1
       ORDER BY cr.created_at DESC
       LIMIT 1`,
    )
    .bind(Number(uid))
    .first<RequestRow>();

  const [banners, access] = await Promise.all([
    listActiveBanners(db),
    getUserAccess(db, Number(uid)),
  ]);
  const modules = await listPublishedModulesWithLessons(db, access);

  const firstName   = user.name.split(" ")[0];
  const isMigration = request?.solicitation_type === "migration";
  const migStatus   = request?.migration_status ?? null;
  const migDone     = migStatus === "published" || migStatus === "delivered";
  const isDelivered = request?.status === "delivered" || migDone;

  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-[#111111] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-rb.png"
              alt="Rebanho Blindado"
              width={36}
              height={36}
              style={{ width: 36, height: "auto", borderRadius: 6, flexShrink: 0 }}
              priority
            />
            <div className="hidden sm:block">
              <p className="text-xs text-white/40 leading-none">Olá,</p>
              <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
            </div>
            <p className="text-sm text-white/70 sm:hidden">Olá, <span className="font-semibold text-white">{firstName}</span></p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Notificações"
            >
              <Bell className="h-4.5 w-4.5" />
            </button>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-xs transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* ── Calendar status card ─────────────────────────────────────────── */}
        {request && (
          <div className={`rounded-2xl overflow-hidden shadow-sm ${
            isDelivered
              ? "bg-[#111111]"
              : isMigration
                ? "bg-[#111111]"
                : "bg-[#111111]"
          }`}>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {isDelivered ? (
                    <div className="w-9 h-9 rounded-full bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-[#CC0000]" />
                    </div>
                  ) : isMigration ? (
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
                      {isDelivered
                        ? "Calendário disponível!"
                        : isMigration
                          ? "Em transferência"
                          : "Em produção"}
                    </h2>
                  </div>
                </div>

                {isMigration && migStatus && !migDone && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/15 whitespace-nowrap">
                    {MIGRATION_LABEL[migStatus]}
                  </span>
                )}
              </div>

              {!isDelivered && (
                <p className="text-sm text-white/55 leading-relaxed">
                  {isMigration
                    ? "Nossa equipe irá localizar o PDF do seu calendário existente, transcrevê-lo e publicá-lo aqui para você."
                    : "Recebemos suas informações e nossa equipe já está trabalhando na criação do seu calendário sanitário personalizado."}
                </p>
              )}

              {isDelivered && (
                <p className="text-sm text-white/55 leading-relaxed">
                  Seu calendário sanitário personalizado está pronto e disponível para uso.
                </p>
              )}

              {!isDelivered && (isMigration ? request.estimated_delivery_date : request.deadline) && (
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

              {isDelivered && (
                <button className="w-full py-3 rounded-xl bg-[#CC0000] text-white text-sm font-bold hover:bg-[#AA0000] transition-colors">
                  Abrir Calendário
                </button>
              )}
            </div>

            {/* Progress bar for migration */}
            {isMigration && !migDone && migStatus && (
              <div className="bg-white/5 px-5 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-white/30">Progresso</span>
                  <span className="text-[10px] text-white/30">
                    {migStatus === "awaiting_migration" ? "1/4" :
                     migStatus === "in_migration"       ? "2/4" :
                     migStatus === "internal_review"    ? "3/4" : "4/4"}
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#CC0000] rounded-full transition-all"
                    style={{
                      width:
                        migStatus === "awaiting_migration" ? "25%" :
                        migStatus === "in_migration"       ? "50%" :
                        migStatus === "internal_review"    ? "75%" : "100%",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  {["Aguardando", "Transferindo", "Revisão", "Publicado"].map((step, i) => {
                    const stepOrder = ["awaiting_migration", "in_migration", "internal_review", "published"];
                    const currentIdx = stepOrder.indexOf(migStatus ?? "");
                    const done = i <= currentIdx;
                    return (
                      <span key={step} className={`text-[9px] ${done ? "text-white/50" : "text-white/20"}`}>
                        {step}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Banners ──────────────────────────────────────────────────────── */}
        {banners.length > 0 && (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div key={banner.id} className="rounded-2xl overflow-hidden shadow-sm">
                {banner.image_url ? (
                  <div className="relative">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full object-cover max-h-44"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-sm font-bold text-white leading-snug">{banner.title}</p>
                      {banner.description && (
                        <p className="text-xs text-white/70 mt-0.5 line-clamp-2">{banner.description}</p>
                      )}
                      {banner.button_label && banner.button_link && (
                        <Link
                          href={banner.button_link}
                          className="inline-block mt-2.5 px-4 py-1.5 bg-[#CC0000] text-white text-xs font-bold rounded-lg hover:bg-[#AA0000] transition-colors"
                        >
                          {banner.button_label}
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-white">
                    <p className="text-sm font-bold text-gray-900">{banner.title}</p>
                    {banner.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{banner.description}</p>
                    )}
                    {banner.button_label && banner.button_link && (
                      <Link
                        href={banner.button_link}
                        className="inline-block mt-3 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-lg hover:bg-[#AA0000] transition-colors"
                      >
                        {banner.button_label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Educational content ───────────────────────────────────────────── */}
        {modules.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Conteúdo educacional
              </h2>
              <Link
                href="/dashboard/conteudos"
                className="flex items-center gap-1 text-xs text-[#CC0000] font-semibold hover:underline"
              >
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Module cards — horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible">
              {modules.slice(0, 4).map((mod) => (
                <Link
                  key={mod.id}
                  href="/dashboard/conteudos"
                  className="flex-shrink-0 w-44 sm:w-auto bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {mod.thumbnail_url ? (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={mod.thumbnail_url}
                        alt={mod.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="aspect-video w-full flex items-center justify-center"
                      style={{ background: `${mod.accent_color}22` }}
                    >
                      <BookOpen className="h-8 w-8" style={{ color: mod.accent_color }} />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{mod.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {mod.lessons.length} aula{mod.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Conteúdos em breve</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Enquanto seu calendário fica pronto, novos conteúdos sobre manejo sanitário serão disponibilizados aqui.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick tools ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Ferramentas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/ferramentas"
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-9 h-9 rounded-xl bg-[#CC0000]/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="h-4.5 w-4.5 text-[#CC0000]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">Calculadora</p>
                <p className="text-[10px] text-gray-400">Doses e custos</p>
              </div>
            </Link>
            <Link
              href="/dashboard/historico"
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4.5 w-4.5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">Histórico</p>
                <p className="text-[10px] text-gray-400">Manejos e eventos</p>
              </div>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
