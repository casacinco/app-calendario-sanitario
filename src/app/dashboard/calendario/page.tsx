import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Printer, CalendarDays, Clock, CheckCircle2, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { getEnv } from "@/lib/cf";
import { getUserById, listActiveBannersByPlacement } from "@/lib/db";
import { formatDateBR } from "@/lib/format";
import { PlacementBanners } from "@/components/producer/placement-banners";
import { BackButton } from "@/components/producer/back-button";
import { ScaledIframe } from "@/components/producer/scaled-iframe";
import { AvisoImportante } from "@/components/producer/aviso-importante";
import { ManejosOperacional } from "@/components/producer/manejos-operacional";
import { getEventsGrouped } from "@/lib/calendar-events";
import type { RequestStatus, SolicitationType, MigrationStatus } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface RequestRow {
  id: number;
  status: RequestStatus;
  solicitation_type: SolicitationType;
  migration_status: MigrationStatus | null;
  estimated_delivery_date: string | null;
  deadline: string | null;
  cal_status: string | null;
  cal_id: number | null;
  calendar_intro_confirmed: number | null;
}

const MIGRATION_LABEL: Record<MigrationStatus, string> = {
  awaiting_migration: "Aguardando início",
  in_migration:       "Em transferência",
  internal_review:    "Em revisão final",
  published:          "Disponível",
  delivered:          "Entregue",
};

const STEPS = ["Aguardando", "Transferindo", "Revisão", "Publicado"] as const;
const STEP_KEYS: MigrationStatus[] = ["awaiting_migration", "in_migration", "internal_review", "published"];

export default async function CalendarioPage() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const db = getEnv().DB;
  const user = await getUserById(db, Number(uid));
  if (!user) redirect("/auth");

  const [request, banners] = await Promise.all([
    db
      .prepare(
        `SELECT cr.id, cr.status, cr.solicitation_type, cr.migration_status,
                cr.estimated_delivery_date, cr.deadline, cr.calendar_intro_confirmed,
                c.status AS cal_status, c.id AS cal_id
         FROM calendar_requests cr
         LEFT JOIN calendars c ON c.request_id = cr.id
         WHERE cr.user_id = ?1
         ORDER BY cr.created_at DESC
         LIMIT 1`,
      )
      .bind(Number(uid))
      .first<RequestRow>(),
    listActiveBannersByPlacement(db, "calendario"),
  ]);

  const isMigration  = request?.solicitation_type === "migration";
  const migStatus    = request?.migration_status ?? null;
  const migDone      = migStatus === "published" || migStatus === "delivered";
  const isDelivered  = request?.status === "delivered" || migDone;
  const calId        = request?.cal_id ?? null;
  const calPublished = request?.cal_status === "published";
  const introConfirmed = !!request?.calendar_intro_confirmed;
  const showAviso    = isDelivered && !isMigration && !introConfirmed;

  const cur = new Date().getMonth();  // 0-based
  const curMonthName = MONTHS[cur]!;

  // Busca eventos apenas se o calendário está publicado
  const events = (isDelivered && calPublished)
    ? await getEventsGrouped(db, Number(uid))
    : null;

  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <BackButton />
          <h1 className="text-base font-bold text-gray-900 flex-1">Meu Calendário</h1>
          {isDelivered && calId && calPublished && (
            <Link
              href={`/calendarios/${calId}/print`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#CC0000] text-white text-xs font-bold hover:bg-[#AA0000] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir / Salvar PDF
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        <PlacementBanners banners={banners} />

        {isDelivered && calId && calPublished && events ? (
          <>
            {/* ── 1. Aviso importante ── */}
            {showAviso && <AvisoImportante />}

            {/* ── 2-5. Atrasados / Este mês / Próximo mês / Categorias ── */}
            <ManejosOperacional
              overdue={events.overdue}
              thisMonth={events.thisMonth}
              nextMonth={events.nextMonth}
              continuous={events.continuous}
              implantacao={events.implantacao}
              curMonthName={curMonthName}
              nextMonthName={events.nextMonthIndex !== null ? MONTHS[events.nextMonthIndex - 1]! : null}
            />

            {/* ── 6. Calendário visual ── */}
            <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#CC0000]" />
                <span className="text-sm font-bold text-gray-900">Calendário Sanitário</span>
              </div>

              <ScaledIframe src={`/calendarios/${calId}/print?embed=1`} />

              <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/calendarios/${calId}/print`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#CC0000] text-white text-sm font-bold hover:bg-[#AA0000] transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / Salvar PDF
                </Link>
              </div>
            </div>
          </>

        ) : request ? (
          /* ── Status / progresso ── */
          <>
            <div className="bg-[#111111] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isDelivered ? (
                      <div className="w-10 h-10 rounded-full bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-[#CC0000]" />
                      </div>
                    ) : isMigration ? (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft className="h-5 w-5 text-white/70" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-[#CC0000]" />
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                        {isMigration ? "Migração de calendário" : "Seu calendário"}
                      </p>
                      <h2 className="text-base font-bold text-white leading-tight">
                        {isDelivered ? "Calendário disponível!" : isMigration ? "Em transferência" : "Em produção"}
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
              </div>

              {isMigration && !migDone && migStatus && (
                <div className="bg-white/5 px-5 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Progresso</span>
                    <span className="text-[10px] text-white/30">{STEP_KEYS.indexOf(migStatus) + 1}/4</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#CC0000] rounded-full transition-all"
                      style={{ width: `${(STEP_KEYS.indexOf(migStatus) + 1) * 25}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    {STEPS.map((step, i) => {
                      const currentIdx = STEP_KEYS.indexOf(migStatus ?? "awaiting_migration" as MigrationStatus);
                      return (
                        <span key={step} className={`text-[9px] ${i <= currentIdx ? "text-white/50" : "text-white/20"}`}>{step}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {!isDelivered && (
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-xs font-bold text-gray-700">O que está incluído no seu calendário?</p>
                <ul className="space-y-1.5">
                  {["Cronograma de vacinações por espécie","Vermifugações e controles parasitários","Datas de manejo e eventos sanitários","Protocolos personalizados para seu rebanho"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-[#CC0000] flex-shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>

        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-900">Nenhuma solicitação encontrada</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
              Você ainda não possui uma solicitação de calendário sanitário em andamento.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
