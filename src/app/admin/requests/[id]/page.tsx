import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import { CreateCalendarButton } from "@/components/create-calendar-button";
import { getRequestFullDetails } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { formatDateBR } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Estrutura completa do raw_responses (todos os campos do formulário) ───────

interface FormData {
  // Etapa 1 — Identificação
  nome?: string;
  email?: string;
  instagram?: string;
  telefone?: string;
  // Etapa 2 — Propriedade
  nome_proprietario?: string;
  nome_rebanho?: string;
  inicio_criacao?: string;
  // Etapa 3 — Rebanho
  qtd_reprodutores?: string;
  racas_reprodutores?: string[];
  qtd_matrizes?: string;
  racas_matrizes?: string[];
  // Etapa 4 — Sistema de criação
  sistema_criacao?: string;
  pais?: string;
  estado?: string;
  cidade_brasil?: string;
  cidade_fora?: string;
  propriedades_vizinhas?: string;
  // Etapa 5 — Condições ambientais
  meses_chuva?: string[];
  // Etapa 6 — Reprodução
  meses_monta?: string[];
  idade_apartacao?: string;
  // Etapa 7 — Sanitário
  assistencia_vet?: string;
  possui_calendario?: string;
  causas_obito?: string[];
  frequencia_obito?: string;
  vacinas?: string[];
  decisao_compra?: string;
  mortalidade_atual?: string;
  ja_tentou?: string;
  info_adicionais?: string;
  espera_alcancar?: string;
}

function parseFormData(raw: string | null | undefined): FormData {
  if (!raw) return {};
  try { return JSON.parse(raw) as FormData; }
  catch { return {}; }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function display(v: string | null | undefined): string {
  return v && v.trim() ? v : "—";
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="text-sm">{display(value)}</dd>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] | null | undefined }) {
  const list = items?.filter(Boolean) ?? [];
  return (
    <div className="space-y-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd>
        {list.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {list.map((item) => (
              <span
                key={item}
                className="text-xs bg-text/5 text-text border border-border rounded-md px-2 py-0.5"
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm">—</span>
        )}
      </dd>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) notFound();

  const data = await getRequestFullDetails(getEnv().DB, requestId);
  if (!data) notFound();

  const { request, user, farm, questionnaire, calendar } = data;

  // Fonte única: raw_responses do questionário
  const f = parseFormData(questionnaire?.raw_responses);

  // Cidade: Brasil usa cidade_brasil; fora usa cidade_fora
  const cidade = f.pais === "Brasil" ? f.cidade_brasil : (f.cidade_fora ?? f.cidade_brasil);

  return (
    <div className="space-y-6">
      {/* Back */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para solicitações
        </Link>
      </div>

      {/* Header — metadados da solicitação (não do formulário) */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {f.nome ?? user.name}
            </h1>
            <RequestStatusBadge status={request.status} />
          </div>
          <p className="text-text-muted text-sm">
            {f.nome_rebanho ?? farm.name}
            {(f.cidade_brasil || f.cidade_fora || f.estado)
              ? ` · ${[cidade, f.estado].filter(Boolean).join("/")}` : ""}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
            <span>
              <span className="font-medium text-text-muted/70 uppercase tracking-wide text-[10px]">Solicitação</span>{" "}
              {formatDateBR(request.created_at)}
            </span>
            <span>
              <span className="font-medium text-text-muted/70 uppercase tracking-wide text-[10px]">Prazo</span>{" "}
              {request.deadline ? formatDateBR(request.deadline) : "—"}
            </span>
            <span>
              <span className="font-medium text-text-muted/70 uppercase tracking-wide text-[10px]">Entrega</span>{" "}
              {calendar?.published_at ? formatDateBR(calendar.published_at) : "—"}
            </span>
          </div>
        </div>

        <div>
          {calendar ? (
            <Link
              href={`/admin/calendarios/${calendar.id}`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-card text-text text-sm font-medium hover:bg-text/5 transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Abrir calendário
            </Link>
          ) : (
            <CreateCalendarButton requestId={request.id} />
          )}
        </div>
      </header>

      {/* 1. IDENTIFICAÇÃO */}
      <Card>
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo"        value={f.nome} />
            <Field label="E-mail"               value={f.email} />
            <Field label="Instagram"            value={f.instagram} />
            <Field label="Telefone / WhatsApp"  value={f.telefone} />
          </dl>
        </CardContent>
      </Card>

      {/* 2. PROPRIEDADE */}
      <Card>
        <CardHeader><CardTitle>Propriedade</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do proprietário"       value={f.nome_proprietario} />
            <Field label="Nome do rebanho / cabanha"  value={f.nome_rebanho} />
            <Field label="Início da criação"          value={formatDateBR(f.inicio_criacao)} />
          </dl>
        </CardContent>
      </Card>

      {/* 3. REBANHO */}
      <Card>
        <CardHeader><CardTitle>Rebanho</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Qtd. reprodutores"      value={f.qtd_reprodutores} />
            <Chips label="Raça dos reprodutores"  items={f.racas_reprodutores} />
            <Field label="Qtd. matrizes"          value={f.qtd_matrizes} />
            <Chips label="Raça das matrizes"      items={f.racas_matrizes} />
          </dl>
        </CardContent>
      </Card>

      {/* 4. SISTEMA DE CRIAÇÃO */}
      <Card>
        <CardHeader><CardTitle>Sistema de Criação</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4">
            <Field label="Sistema de criação" value={f.sistema_criacao} />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="País"    value={f.pais} />
              <Field label="Estado"  value={f.estado} />
              <Field label="Cidade"  value={cidade} />
            </div>
            <Field
              label="Propriedades vizinhas (ovinocultura / caprinocultura / bovinocultura)"
              value={f.propriedades_vizinhas}
            />
          </dl>
        </CardContent>
      </Card>

      {/* 5. CONDIÇÕES AMBIENTAIS */}
      <Card>
        <CardHeader><CardTitle>Condições Ambientais</CardTitle></CardHeader>
        <CardContent>
          <dl>
            <Chips label="Meses de maior incidência de chuva" items={f.meses_chuva} />
          </dl>
        </CardContent>
      </Card>

      {/* 6. REPRODUÇÃO */}
      <Card>
        <CardHeader><CardTitle>Reprodução</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4">
            <Chips label="Meses da estação de monta" items={f.meses_monta} />
            <Field label="Idade de apartação"        value={f.idade_apartacao} />
          </dl>
        </CardContent>
      </Card>

      {/* 7. SANITÁRIO */}
      <Card>
        <CardHeader><CardTitle>Sanitário</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Assistência veterinária"  value={f.assistencia_vet} />
            <Field label="Possui outro calendário"  value={f.possui_calendario} />
            <div className="md:col-span-2">
              <Chips label="Principais causas de óbito" items={f.causas_obito} />
            </div>
            <Field label="Frequência de entrada/saída de animais" value={f.frequencia_obito} />
            <div className="md:col-span-2">
              <Chips label="Vacinas utilizadas" items={f.vacinas} />
            </div>
            <div className="md:col-span-2">
              <Field label="Motivo da compra do calendário"   value={f.decisao_compra} />
            </div>
            <div className="md:col-span-2">
              <Field label="Taxa de mortalidade atual"        value={f.mortalidade_atual} />
            </div>
            <div className="md:col-span-2">
              <Field label="O que já tentou e não funcionou"  value={f.ja_tentou} />
            </div>
            <div className="md:col-span-2">
              <Field label="Informações adicionais"           value={f.info_adicionais} />
            </div>
            <div className="md:col-span-2">
              <Field label="Resultado esperado"               value={f.espera_alcancar} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
