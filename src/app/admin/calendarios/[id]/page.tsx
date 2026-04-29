import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CalendarEditor } from "@/components/calendar-editor";
import { PublishButton } from "@/components/publish-button";
import { getCalendarFullDetails } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { formatDateBR } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Campos do raw_responses relevantes para o editor ────────────────────────

interface ProducerContext {
  sistema_criacao?: string;
  pais?: string;
  estado?: string;
  cidade_brasil?: string;
  cidade_fora?: string;
  meses_chuva?: string[];
  meses_monta?: string[];
  racas_reprodutores?: string[];
  racas_matrizes?: string[];
  vacinas?: string[];
  causas_obito?: string[];
  assistencia_vet?: string;
  qtd_reprodutores?: string;
  qtd_matrizes?: string;
  mortalidade_atual?: string;
  decisao_compra?: string;
  ja_tentou?: string;
  info_adicionais?: string;
  propriedades_vizinhas?: string;
  idade_apartacao?: string;
}

function parseContext(raw: string | null): ProducerContext {
  if (!raw) return {};
  try { return JSON.parse(raw) as ProducerContext; }
  catch { return {}; }
}

// ─── Alertas automáticos ─────────────────────────────────────────────────────

interface CtxAlert {
  level: "danger" | "warning";
  text: string;
}

function computeAlerts(ctx: ProducerContext): CtxAlert[] {
  const alerts: CtxAlert[] = [];

  if (ctx.mortalidade_atual?.trim()) {
    alerts.push({
      level: "danger",
      text: `Mortalidade declarada: ${ctx.mortalidade_atual}`,
    });
  }

  const temVerminose = ctx.causas_obito?.some((c) =>
    c.toLowerCase().includes("vermin"),
  );
  if (temVerminose) {
    alerts.push({
      level: "warning",
      text: "Verminose entre as causas de óbito — reforçar cronograma de vermifugação",
    });
  }

  const extensivo = ctx.sistema_criacao?.toLowerCase().includes("extensiv") ?? false;
  const temChuva = (ctx.meses_chuva?.length ?? 0) > 0;
  if (extensivo && temChuva) {
    alerts.push({
      level: "warning",
      text: "Sistema extensivo com estação chuvosa — risco elevado de parasitas e doenças do solo",
    });
  }

  return alerts;
}

// ─── Componentes primários (campos de decisão) ────────────────────────────────

function PrimaryField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function PrimaryChips({
  label,
  items,
  chipClass,
}: {
  label: string;
  items: string[] | null | undefined;
  chipClass: string;
}) {
  const list = items?.filter(Boolean) ?? [];
  if (list.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((item) => (
          <span key={item} className={`text-[11px] font-medium rounded px-2 py-0.5 border ${chipClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Componentes secundários (contexto de apoio) ──────────────────────────────

function SecField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-text-muted/60 mb-0.5">{label}</p>
      <p className="text-xs text-text-muted">{value}</p>
    </div>
  );
}

function SecChips({ label, items }: { label: string; items: string[] | null | undefined }) {
  const list = items?.filter(Boolean) ?? [];
  if (list.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-text-muted/60 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {list.map((item) => (
          <span key={item} className="text-[11px] bg-text/[0.04] border border-border/60 rounded px-1.5 py-px text-text-muted">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Texto livre do produtor ─────────────────────────────────────────────────

function TextoField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-xs text-text leading-relaxed">&ldquo;{value}&rdquo;</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CalendarPage({ params }: PageProps) {
  const { id } = await params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) notFound();

  const data = await getCalendarFullDetails(getEnv().DB, calendarId);
  if (!data) notFound();

  const { calendar, request, user, farm, blocks, rawResponses } = data;
  const ctx = parseContext(rawResponses);
  const alerts = computeAlerts(ctx);

  const cidade = ctx.pais === "Brasil" ? ctx.cidade_brasil : (ctx.cidade_fora ?? ctx.cidade_brasil);

  const totalRows = blocks.reduce((sum, b) => sum + b.rows.length, 0);
  const activeRows = blocks.reduce(
    (sum, b) => sum + b.rows.filter((r) => r.is_active).length,
    0,
  );
  const totalBars = blocks.reduce(
    (sum, b) => sum + b.rows.reduce((s, r) => s + r.bars.length, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/requests/${request.id}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a solicitação
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Calendário · {user.name}
            </h1>
            <Badge variant={calendar.status === "published" ? "success" : "default"}>
              {calendar.status === "published" ? "Publicado" : "Rascunho"}
            </Badge>
          </div>
          <p className="text-text-muted text-sm">
            {farm.name}
            {farm.city || farm.state
              ? ` · ${[farm.city, farm.state].filter(Boolean).join("/")}`
              : ""}
          </p>
          <p className="text-text-muted text-xs">
            Calendário #{calendar.id} · solicitação #{request.id} · criado em{" "}
            {formatDateBR(calendar.created_at)}
            {calendar.published_at
              ? ` · publicado em ${formatDateBR(calendar.published_at)}`
              : ""}
          </p>
          <p className="text-text-muted text-xs">
            {blocks.length} blocos · {activeRows}/{totalRows} linhas ativas ·{" "}
            {totalBars} barras
          </p>
        </div>
        {calendar.status === "draft" && (
          <PublishButton calendarId={calendar.id} />
        )}
      </header>

      {/* Contexto do produtor */}
      {rawResponses && (
        <details className="group rounded-lg border border-border bg-card" open>
          <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium list-none">
            <span className="flex items-center gap-2">
              Contexto do produtor
              {alerts.length > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-px rounded-full border ${
                  alerts.some((a) => a.level === "danger")
                    ? "bg-red/10 text-red border-red/30"
                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/25"
                }`}>
                  {alerts.length} alerta{alerts.length > 1 ? "s" : ""}
                </span>
              )}
            </span>
            <svg
              className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </summary>

          <div className="border-t border-border divide-y divide-border">

            {/* Alertas automáticos */}
            {alerts.length > 0 && (
              <div className="px-4 py-3 space-y-2">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs border ${
                      a.level === "danger"
                        ? "bg-red/10 text-red border-red/30"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/25"
                    }`}
                  >
                    <span className="shrink-0 mt-px font-bold">
                      {a.level === "danger" ? "!" : "⚠"}
                    </span>
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Campos primários — decisão */}
            <div className="px-4 py-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <PrimaryField label="Sistema de criação" value={ctx.sistema_criacao} />
              </div>
              <div className="space-y-3">
                <PrimaryChips
                  label="Meses de chuva"
                  items={ctx.meses_chuva}
                  chipClass="bg-blue-500/10 text-blue-500 border-blue-500/25"
                />
                <PrimaryChips
                  label="Causas de óbito"
                  items={ctx.causas_obito}
                  chipClass="bg-amber-500/10 text-amber-600 border-amber-500/25"
                />
              </div>
            </div>

            {/* Campos secundários — contexto de apoio */}
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
                <SecField label="Estado" value={ctx.estado} />
                <SecField label="Cidade" value={cidade} />
                <SecField label="Assistência vet." value={ctx.assistencia_vet} />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
                <SecField label="Reprodutores" value={ctx.qtd_reprodutores} />
                <SecChips label="Raças (reprod.)" items={ctx.racas_reprodutores} />
                <SecField label="Matrizes" value={ctx.qtd_matrizes} />
                <SecChips label="Raças (matrizes)" items={ctx.racas_matrizes} />
              </div>
              <div className="grid grid-cols-1 gap-y-2.5 sm:grid-cols-2 sm:gap-x-6">
                <SecChips label="Estação de monta" items={ctx.meses_monta} />
                <SecChips label="Vacinas já utilizadas" items={ctx.vacinas} />
              </div>
            </div>

            {/* Texto livre do produtor */}
            {(ctx.decisao_compra || ctx.ja_tentou || ctx.info_adicionais || ctx.propriedades_vizinhas || ctx.idade_apartacao) && (
              <div className="px-4 py-4 space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Texto do produtor</p>
                <div className="space-y-3">
                  <TextoField label="Decisão de compra" value={ctx.decisao_compra} />
                  <TextoField label="O que já tentou" value={ctx.ja_tentou} />
                  <TextoField label="Informações adicionais" value={ctx.info_adicionais} />
                  <TextoField label="Propriedades vizinhas" value={ctx.propriedades_vizinhas} />
                  <TextoField label="Idade de apartação" value={ctx.idade_apartacao} />
                </div>
              </div>
            )}

          </div>
        </details>
      )}

      <CalendarEditor initialBlocks={blocks} calendarId={calendar.id} />
    </div>
  );
}
