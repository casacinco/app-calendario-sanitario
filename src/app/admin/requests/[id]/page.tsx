import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import { CreateCalendarButton } from "@/components/create-calendar-button";
import { getRequestFullDetails } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { formatDateBR, formatNumberBR } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="text-sm whitespace-pre-wrap">{display}</dd>
    </div>
  );
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) notFound();

  const data = await getRequestFullDetails(getEnv().DB, requestId);
  if (!data) notFound();

  const { request, user, farm, flock, questionnaire, calendar } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para solicitações
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.name}
            </h1>
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

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" value={user.name} />
            <Field label="E-mail" value={user.email} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propriedade</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da propriedade" value={farm.name} />
            <Field
              label="Localização"
              value={[farm.city, farm.state].filter(Boolean).join("/") || null}
            />
            <div className="md:col-span-2">
              <Field label="Observações" value={farm.notes} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rebanho</CardTitle>
        </CardHeader>
        <CardContent>
          {flock ? (
            <dl className="grid gap-4 md:grid-cols-2">
              <Field label="Espécie" value={flock.species} />
              <Field
                label="Total de animais"
                value={formatNumberBR(flock.total_animals)}
              />
              <Field label="Tipo de alojamento" value={flock.housing_type} />
              <div className="md:col-span-2">
                <Field label="Categorias / lotes" value={flock.age_groups} />
              </div>
            </dl>
          ) : (
            <p className="text-text-muted text-sm">Sem dados de rebanho.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sanitário</CardTitle>
        </CardHeader>
        <CardContent>
          {questionnaire ? (
            <dl className="grid gap-4 md:grid-cols-2">
              <Field
                label="Histórico de vacinação"
                value={questionnaire.vaccination_history}
              />
              <Field
                label="Medicamentos em uso"
                value={questionnaire.current_medications}
              />
              <Field
                label="Doenças recentes"
                value={questionnaire.recent_diseases}
              />
              <Field label="Fonte de água" value={questionnaire.water_source} />
              <Field label="Fonte de ração" value={questionnaire.feed_source} />
              <Field
                label="Assistência veterinária"
                value={questionnaire.veterinary_assistance}
              />
              <div className="md:col-span-2">
                <Field
                  label="Biossegurança"
                  value={questionnaire.biosecurity_practices}
                />
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Informações adicionais"
                  value={questionnaire.additional_info}
                />
              </div>
            </dl>
          ) : (
            <p className="text-text-muted text-sm">Sem questionário sanitário.</p>
          )}
        </CardContent>
      </Card>

      {request.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas da solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
