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

// ─── Raw responses shape (formulário multi-etapas) ────────────────────────────

interface RawResponses {
  instagram?: string;
  telefone?: string;
  nome_proprietario?: string;
  inicio_criacao?: string;
  propriedades_vizinhas?: string;
  meses_chuva?: string[];
  meses_monta?: string[];
  idade_apartacao?: string;
  possui_calendario?: string;
  causas_obito?: string[];
  frequencia_obito?: string;
  decisao_compra?: string;
  mortalidade_atual?: string;
  ja_tentou?: string;
  espera_alcancar?: string;
}

function parseRaw(raw: string | null | undefined): RawResponses {
  if (!raw) return {};
  try { return JSON.parse(raw) as RawResponses; }
  catch { return {}; }
}

// Parse "Reprodutores: 5 (Dorper, Santa Inês); Matrizes: 10 (Dorper, Mestiças)"
function parseAgeGroups(ag: string | null | undefined) {
  const reprMatch = (ag ?? "").match(/Reprodutores:\s*(\d+)\s*\(([^)]*)\)/);
  const matrMatch = (ag ?? "").match(/Matrizes:\s*(\d+)\s*\(([^)]*)\)/);
  return {
    qtdReprodutores: reprMatch?.[1] ?? null,
    racasReprodutores: reprMatch?.[2]?.split(", ").filter(Boolean) ?? [],
    qtdMatrizes:      matrMatch?.[1] ?? null,
    racasMatrizes:    matrMatch?.[2]?.split(", ").filter(Boolean) ?? [],
  };
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

  const { request, user, farm, flock, questionnaire, calendar } = data;
  const raw = parseRaw(questionnaire?.raw_responses);
  const { qtdReprodutores, racasReprodutores, qtdMatrizes, racasMatrizes } =
    parseAgeGroups(flock?.age_groups);

  const vacinas = questionnaire?.vaccination_history
    ?.split(", ")
    .filter(Boolean) ?? [];

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

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
            <RequestStatusBadge status={request.status} />
          </div>
          <p className="text-text-muted text-sm">
            {farm.name}
            {farm.city || farm.state
              ? ` · ${[farm.city, farm.state].filter(Boolean).join("/")}`
              : ""}
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
            <Field label="Nome completo"           value={user.name} />
            <Field label="E-mail"                  value={user.email} />
            <Field label="Instagram"               value={raw.instagram} />
            <Field label="Telefone / WhatsApp"     value={raw.telefone} />
          </dl>
        </CardContent>
      </Card>

      {/* 2. PROPRIEDADE */}
      <Card>
        <CardHeader><CardTitle>Propriedade</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Nome do proprietário"    value={raw.nome_proprietario} />
            <Field label="Nome do rebanho / cabanha" value={farm.name} />
            <Field label="Início da criação"       value={formatDateBR(raw.inicio_criacao)} />
          </dl>
        </CardContent>
      </Card>

      {/* 3. REBANHO */}
      <Card>
        <CardHeader><CardTitle>Rebanho</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Qtd. reprodutores"       value={qtdReprodutores} />
            <div className="md:col-span-1">
              <Chips label="Raça dos reprodutores" items={racasReprodutores} />
            </div>
            <Field label="Qtd. matrizes"           value={qtdMatrizes} />
            <div className="md:col-span-1">
              <Chips label="Raça das matrizes"     items={racasMatrizes} />
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 4. SISTEMA DE CRIAÇÃO */}
      <Card>
        <CardHeader><CardTitle>Sistema de Criação</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4">
            <Field label="Sistema de criação"      value={farm.notes} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado"                value={farm.state} />
              <Field label="Cidade"                value={farm.city} />
            </div>
            <Field
              label="Propriedades vizinhas (ovinocultura / caprinocultura / bovinocultura)"
              value={raw.propriedades_vizinhas}
            />
          </dl>
        </CardContent>
      </Card>

      {/* 5. CONDIÇÕES AMBIENTAIS */}
      <Card>
        <CardHeader><CardTitle>Condições Ambientais</CardTitle></CardHeader>
        <CardContent>
          <dl>
            <Chips label="Meses de maior incidência de chuva" items={raw.meses_chuva} />
          </dl>
        </CardContent>
      </Card>

      {/* 6. REPRODUÇÃO */}
      <Card>
        <CardHeader><CardTitle>Reprodução</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4">
            <Chips label="Meses da estação de monta" items={raw.meses_monta} />
            <Field label="Idade de apartação"         value={raw.idade_apartacao} />
          </dl>
        </CardContent>
      </Card>

      {/* 7. SANITÁRIO */}
      <Card>
        <CardHeader><CardTitle>Sanitário</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Assistência veterinária"    value={questionnaire?.veterinary_assistance} />
            <Field label="Possui outro calendário"    value={raw.possui_calendario} />
            <div className="md:col-span-2">
              <Chips label="Principais causas de óbito" items={raw.causas_obito} />
            </div>
            <Field label="Frequência de entrada/saída de animais" value={raw.frequencia_obito} />
            <div className="md:col-span-2">
              <Chips label="Vacinas utilizadas"       items={vacinas} />
            </div>
            <div className="md:col-span-2">
              <Field label="Motivo da compra do calendário" value={raw.decisao_compra} />
            </div>
            <div className="md:col-span-2">
              <Field label="Taxa de mortalidade atual"      value={raw.mortalidade_atual} />
            </div>
            <div className="md:col-span-2">
              <Field label="O que já tentou e não funcionou" value={raw.ja_tentou} />
            </div>
            <div className="md:col-span-2">
              <Field label="Informações adicionais"         value={questionnaire?.additional_info} />
            </div>
            <div className="md:col-span-2">
              <Field label="Resultado esperado"             value={raw.espera_alcancar} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
