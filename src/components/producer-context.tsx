"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProducerContext {
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

export interface CtxAlert {
  level: "danger" | "warning";
  text: string;
}

// ─── Lógica (reutilizável pela page no server se necessário) ──────────────────

export function parseContext(raw: string | null): ProducerContext {
  if (!raw) return {};
  try { return JSON.parse(raw) as ProducerContext; }
  catch { return {}; }
}

export function computeAlerts(ctx: ProducerContext): CtxAlert[] {
  const alerts: CtxAlert[] = [];
  if (ctx.mortalidade_atual?.trim()) {
    alerts.push({ level: "danger", text: `Mortalidade declarada: ${ctx.mortalidade_atual}` });
  }
  if (ctx.causas_obito?.some((c) => c.toLowerCase().includes("vermin"))) {
    alerts.push({ level: "warning", text: "Verminose entre as causas de óbito — reforçar cronograma de vermifugação" });
  }
  if ((ctx.sistema_criacao?.toLowerCase().includes("extensiv") ?? false) && (ctx.meses_chuva?.length ?? 0) > 0) {
    alerts.push({ level: "warning", text: "Sistema extensivo com estação chuvosa — risco elevado de parasitas e doenças do solo" });
  }
  return alerts;
}

// ─── Primitivos visuais ───────────────────────────────────────────────────────

function Field({ label, value, bold = false }: { label: string; value: string | null | undefined; bold?: boolean }) {
  if (!value?.trim()) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">{label}</p>
      <p className={bold ? "text-sm font-medium text-text" : "text-xs text-text-muted"}>{value}</p>
    </div>
  );
}

function Chips({ label, items, chipClass }: {
  label: string;
  items: string[] | null | undefined;
  chipClass?: string;
}) {
  const list = items?.filter(Boolean) ?? [];
  if (list.length === 0) return null;
  const cls = chipClass ?? "bg-text/[0.04] border-border/60 text-text-muted";
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {list.map((item) => (
          <span key={item} className={`text-[11px] rounded px-1.5 py-px border ${cls}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-xs text-text leading-relaxed">&ldquo;{value}&rdquo;</p>
    </div>
  );
}

// ─── Seção colapsável ─────────────────────────────────────────────────────────

function Section({ title, open, onToggle, children }: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-text/[0.02] transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 200ms ease" }}>
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────

type SectionKey = "alerts" | "sistema" | "localizacao" | "rebanho" | "reproducao" | "sanitario" | "texto";

export function ProducerContextPanel({ rawResponses }: { rawResponses: string }) {
  const ctx     = parseContext(rawResponses);
  const alerts  = computeAlerts(ctx);
  const cidade  = ctx.pais === "Brasil" ? ctx.cidade_brasil : (ctx.cidade_fora ?? ctx.cidade_brasil);

  const [panelOpen, setPanelOpen] = useState(true);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    alerts:      true,
    sistema:     true,
    localizacao: false,
    rebanho:     false,
    reproducao:  false,
    sanitario:   false,
    texto:       false,
  });

  function toggle(key: SectionKey) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const hasLocalizacao = !!(ctx.estado || cidade || ctx.assistencia_vet);
  const hasRebanho     = !!(ctx.qtd_reprodutores || ctx.qtd_matrizes || ctx.racas_reprodutores?.length || ctx.racas_matrizes?.length);
  const hasReproducao  = !!(ctx.meses_monta?.length);
  const hasSanitario   = !!(ctx.vacinas?.length || ctx.meses_chuva?.length || ctx.causas_obito?.length);
  const hasTexto       = !!(ctx.decisao_compra || ctx.ja_tentou || ctx.info_adicionais || ctx.propriedades_vizinhas || ctx.idade_apartacao);

  return (
    <div className="rounded-lg border border-border bg-card">

      {/* Cabeçalho do painel */}
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-left"
      >
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
        <ChevronDown className={`h-4 w-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${panelOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Corpo do painel */}
      <div style={{ display: "grid", gridTemplateRows: panelOpen ? "1fr" : "0fr", transition: "grid-template-rows 200ms ease" }}>
        <div style={{ overflow: "hidden" }}>
          <div className="border-t border-border divide-y divide-border">

            {/* Alertas */}
            {alerts.length > 0 && (
              <Section title="Alertas" open={open.alerts} onToggle={() => toggle("alerts")}>
                <div className="px-4 pb-3 pt-1 space-y-2">
                  {alerts.map((a, i) => (
                    <div key={i} className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs border ${
                      a.level === "danger"
                        ? "bg-red/10 text-red border-red/30"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/25"
                    }`}>
                      <span className="shrink-0 mt-px font-bold">{a.level === "danger" ? "!" : "⚠"}</span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Sistema de criação */}
            {ctx.sistema_criacao && (
              <Section title="Sistema de criação" open={open.sistema} onToggle={() => toggle("sistema")}>
                <div className="px-4 pb-3 pt-1">
                  <Field label="Sistema de criação" value={ctx.sistema_criacao} bold />
                </div>
              </Section>
            )}

            {/* Localização */}
            {hasLocalizacao && (
              <Section title="Localização" open={open.localizacao} onToggle={() => toggle("localizacao")}>
                <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                  <Field label="Estado" value={ctx.estado} />
                  <Field label="Cidade" value={cidade} />
                  <Field label="Assistência vet." value={ctx.assistencia_vet} />
                </div>
              </Section>
            )}

            {/* Estrutura do rebanho */}
            {hasRebanho && (
              <Section title="Estrutura do rebanho" open={open.rebanho} onToggle={() => toggle("rebanho")}>
                <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
                  <Field label="Reprodutores" value={ctx.qtd_reprodutores} />
                  <Chips label="Raças (reprod.)" items={ctx.racas_reprodutores} />
                  <Field label="Matrizes" value={ctx.qtd_matrizes} />
                  <Chips label="Raças (matrizes)" items={ctx.racas_matrizes} />
                </div>
              </Section>
            )}

            {/* Reprodução */}
            {hasReproducao && (
              <Section title="Reprodução" open={open.reproducao} onToggle={() => toggle("reproducao")}>
                <div className="px-4 pb-3 pt-1">
                  <Chips label="Estação de monta" items={ctx.meses_monta} />
                </div>
              </Section>
            )}

            {/* Sanitário */}
            {hasSanitario && (
              <Section title="Sanitário" open={open.sanitario} onToggle={() => toggle("sanitario")}>
                <div className="px-4 pb-3 pt-1 space-y-3">
                  <Chips label="Vacinas já utilizadas" items={ctx.vacinas} />
                  <Chips label="Meses de chuva" items={ctx.meses_chuva} chipClass="bg-blue-500/10 text-blue-500 border-blue-500/25" />
                  <Chips label="Causas de óbito" items={ctx.causas_obito} chipClass="bg-amber-500/10 text-amber-600 border-amber-500/25" />
                </div>
              </Section>
            )}

            {/* Texto do produtor */}
            {hasTexto && (
              <Section title="Texto do produtor" open={open.texto} onToggle={() => toggle("texto")}>
                <div className="px-4 pb-4 pt-1 space-y-3">
                  <TextField label="Decisão de compra" value={ctx.decisao_compra} />
                  <TextField label="O que já tentou" value={ctx.ja_tentou} />
                  <TextField label="Informações adicionais" value={ctx.info_adicionais} />
                  <TextField label="Propriedades vizinhas" value={ctx.propriedades_vizinhas} />
                  <TextField label="Idade de apartação" value={ctx.idade_apartacao} />
                </div>
              </Section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
