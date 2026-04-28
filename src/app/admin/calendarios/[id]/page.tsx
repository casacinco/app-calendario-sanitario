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

export default async function CalendarPage({ params }: PageProps) {
  const { id } = await params;
  const calendarId = Number(id);
  if (!Number.isInteger(calendarId) || calendarId <= 0) notFound();

  const data = await getCalendarFullDetails(getEnv().DB, calendarId);
  if (!data) notFound();

  const { calendar, request, user, farm, blocks } = data;
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

      <CalendarEditor initialBlocks={blocks} />
    </div>
  );
}
