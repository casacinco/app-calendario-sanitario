"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Clock, AlertTriangle, CalendarDays,
  LayoutGrid, List, CheckCircle2, ChevronLeft, ChevronRight,
  FileText, Mail, ArrowRightLeft, Download, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDateBR } from "@/lib/format";
import type { AdminRequestRow, RequestStatus, SolicitationType, MigrationStatus } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getPlusDaysStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function sladays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const ms = new Date(dateStr + "T00:00:00").getTime() - new Date(getTodayStr() + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
}

type CardStatus = "pending" | "late" | "delivered";

function getCardStatus(r: AdminRequestRow, today: string): CardStatus {
  if (r.status === "delivered") return "delivered";
  if (r.deadline && r.deadline < today) return "late";
  return "pending";
}

function parsePhone(raw: string | null): string {
  if (!raw) return "—";
  try { return (JSON.parse(raw) as Record<string, string>).telefone ?? "—"; }
  catch { return "—"; }
}

function sortByDeadline(a: AdminRequestRow, b: AdminRequestRow) {
  return (a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : 1;
}

const MIG_STATUS_LABEL: Record<MigrationStatus, string> = {
  awaiting_migration: "Aguardando",
  in_migration:       "Em migração",
  internal_review:    "Revisão",
  published:          "Publicado",
  delivered:          "Entregue",
};

const MIG_STATUS_CLS: Record<MigrationStatus, string> = {
  awaiting_migration: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  in_migration:       "bg-blue-500/15   text-blue-400   border-blue-500/25",
  internal_review:    "bg-purple-500/15 text-purple-400 border-purple-500/25",
  published:          "bg-green/15      text-green       border-green/30",
  delivered:          "bg-emerald-400/15 text-emerald-400 border-emerald-400/25",
};

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ cs }: { cs: CardStatus }) {
  const map: Record<CardStatus, { label: string; cls: string }> = {
    pending:   { label: "Aguardando", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25" },
    late:      { label: "Atrasado",   cls: "bg-red/15 text-red border border-red/30" },
    delivered: { label: "Entregue",   cls: "bg-green/15 text-green border border-green/30" },
  };
  const { label, cls } = map[cs];
  return (
    <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Migration badge ──────────────────────────────────────────────────────────

function MigrationBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
      <ArrowRightLeft className="h-2.5 w-2.5" />
      MIGRAÇÃO
    </span>
  );
}

function MigrationSourceBadge({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded font-semibold bg-white/5 text-white/35 border border-white/10 uppercase">
      {source === "manual" ? "MANUAL" : source.toUpperCase()}
    </span>
  );
}

function MigrationStatusBadge({ status }: { status: MigrationStatus }) {
  return (
    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded font-medium border ${MIG_STATUS_CLS[status]}`}>
      {MIG_STATUS_LABEL[status]}
    </span>
  );
}

// ─── SLA Badge ────────────────────────────────────────────────────────────────

function SlaBadge({ estimatedDate, migStatus }: { estimatedDate: string | null; migStatus: MigrationStatus | null }) {
  if (!estimatedDate) return null;
  if (migStatus === "published" || migStatus === "delivered") return null;
  const days = sladays(estimatedDate);
  if (days === null) return null;

  const cls =
    days < 0  ? "bg-red/15 text-red border-red/30" :
    days <= 3 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" :
                "bg-green/15 text-green border-green/30";

  const label =
    days < 0  ? `${Math.abs(days)}d atrasado` :
    days === 0 ? "Hoje" :
    `${days}d restantes`;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium border ${cls}`}>
      <Clock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({ r, today }: { r: AdminRequestRow; today: string }) {
  const cs = getCardStatus(r, today);
  const phone = parsePhone(r.raw_responses);
  const location = [r.farm_city, r.farm_state].filter(Boolean).join("/");
  const isMigration = r.solicitation_type === "migration";

  return (
    <div className={`rounded-xl border p-4 space-y-3 bg-white ${
      cs === "late" ? "border-red-500/30" :
      isMigration   ? "border-blue-400/30" :
      "border-white/8"
    }`}>
      <div>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="font-semibold text-sm text-gray-900 leading-snug">{r.user_name}</p>
          <StatusPill cs={cs} />
        </div>
        <p className="text-xs text-gray-800">{r.farm_name}</p>
        {location && <p className="text-xs text-gray-700">{location}</p>}
        {isMigration && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            <MigrationBadge />
            {r.migration_source && <MigrationSourceBadge source={r.migration_source} />}
          </div>
        )}
      </div>

      {/* Migration status */}
      {isMigration && r.migration_status && (
        <MigrationStatusBadge status={r.migration_status} />
      )}

      {/* SLA */}
      {isMigration && (
        <SlaBadge estimatedDate={r.estimated_delivery_date} migStatus={r.migration_status} />
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3 w-3 text-gray-600 flex-shrink-0" />
          <span className="text-gray-700">
            {isMigration ? "Previsão:" : "Prazo:"}
          </span>
          <span className="text-gray-900 font-medium">
            {isMigration
              ? formatDateBR(r.estimated_delivery_date)
              : formatDateBR(r.deadline)}
          </span>
        </div>
        {phone !== "—" && !isMigration && (
          <p className="text-xs text-gray-700 pl-4">{phone}</p>
        )}
        {isMigration && r.migration_assignee_role && (
          <p className="text-xs text-gray-700 pl-4 capitalize">{r.migration_assignee_role.replace(/_/g, " ")}</p>
        )}
      </div>

      <Link
        href={`/admin/requests/${r.id}`}
        className="block w-full text-center text-xs font-medium border border-gray-200 rounded-lg py-1.5 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
      >
        Ver detalhes
      </Link>
    </div>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionButtons({
  calendarId,
  onEmailClick,
}: {
  calendarId: number | null;
  onEmailClick: () => void;
}) {
  const enabled = calendarId !== null;
  const disabledTitle = "Calendário ainda não criado";

  return (
    <div className="flex items-center gap-0.5">
      {enabled ? (
        <a
          href={`/calendarios/${calendarId}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Ver PDF"
        >
          <FileText className="h-3.5 w-3.5" />
        </a>
      ) : (
        <span className="p-1.5 text-white/20 cursor-not-allowed" title={disabledTitle}>
          <FileText className="h-3.5 w-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={enabled ? onEmailClick : undefined}
        disabled={!enabled}
        title={enabled ? "Enviar por e-mail" : disabledTitle}
        className={`p-1.5 rounded transition-colors ${
          enabled
            ? "hover:bg-white/10 text-white/50 hover:text-white"
            : "text-white/20 cursor-not-allowed"
        }`}
      >
        <Mail className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(rows: AdminRequestRow[], today: string) {
  const ASSIGNEE_LABELS: Record<string, string> = {
    operador: "Operador", suporte: "Suporte",
    equipe_interna: "Equipe interna", administrador: "Administrador",
  };

  const header = [
    "ID", "Produtor", "E-mail", "Telefone", "Fazenda", "Cidade", "UF",
    "Tipo", "Status", "Status Migração", "Origem Migração",
    "Responsável", "Previsão Entrega", "SLA (dias)", "Prazo",
    "Data Publicação", "Data Entrega", "Criado em",
  ];

  const csvRows = rows.map(r => {
    const phone = parsePhone(r.raw_responses);
    const days = sladays(r.estimated_delivery_date);
    const slaLabel = days === null ? "" : days < 0 ? `${Math.abs(days)}d atrasado` : `${days}d`;
    return [
      r.id,
      r.user_name,
      r.user_email,
      phone,
      r.farm_name,
      r.farm_city ?? "",
      r.farm_state ?? "",
      r.solicitation_type === "migration" ? "Migração" : "Standard",
      r.status,
      r.migration_status ? (MIG_STATUS_LABEL[r.migration_status] ?? r.migration_status) : "",
      r.migration_source ?? "",
      r.migration_assignee_role ? (ASSIGNEE_LABELS[r.migration_assignee_role] ?? r.migration_assignee_role) : "",
      r.estimated_delivery_date ?? "",
      slaLabel,
      r.deadline ?? "",
      r.migration_published_at ? r.migration_published_at.slice(0, 10) : "",
      r.delivered_at ? r.delivered_at.slice(0, 10) : "",
      r.created_at.slice(0, 10),
    ];
  });

  const csv = [header, ...csvRows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `solicitacoes-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Input helpers ────────────────────────────────────────────────────────────

const inputCls =
  "bg-[hsl(var(--card))] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25 placeholder:text-white/25";

// ─── Main ────────────────────────────────────────────────────────────────────

type Tab = "kanban" | "tabela" | "entregues";
type PerPage = 10 | 25 | 50;
type SlaFilter = "" | "ok" | "warning" | "late";

export function AdminRequests({ requests }: { requests: AdminRequestRow[] }) {
  const today: string = getTodayStr();
  const plus7: string = getPlusDaysStr(7);

  const [tab,           setTab]           = useState<Tab>("kanban");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<RequestStatus | "late" | "">("");
  const [typeFilter,    setTypeFilter]    = useState<SolicitationType | "">("");
  const [migFilter,     setMigFilter]     = useState<MigrationStatus | "">("");
  const [slaFilter,     setSlaFilter]     = useState<SlaFilter>("");
  const [createdStart,  setCreatedStart]  = useState("");
  const [createdEnd,    setCreatedEnd]    = useState("");
  const [deadlineStart, setDeadlineStart] = useState("");
  const [deadlineEnd,   setDeadlineEnd]   = useState("");
  const [page,          setPage]          = useState(1);
  const [perPage,       setPerPage]       = useState<PerPage>(10);
  const [toast,         setToast]         = useState<string | null>(null);

  function resetPage() { setPage(1); }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // ─── Filtered set ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const ph = parsePhone(r.raw_responses).toLowerCase();
        if (
          !r.user_name.toLowerCase().includes(q) &&
          !r.user_email.toLowerCase().includes(q) &&
          !r.farm_name.toLowerCase().includes(q) &&
          !ph.includes(q)
        ) return false;
      }
      if (statusFilter) {
        if (statusFilter === "late") {
          if (!(r.deadline && r.deadline < today && r.status !== "delivered")) return false;
        } else {
          if (r.status !== statusFilter) return false;
        }
      }
      if (typeFilter && r.solicitation_type !== typeFilter) return false;
      if (migFilter && r.migration_status !== migFilter) return false;
      if (slaFilter) {
        const days = sladays(r.estimated_delivery_date);
        if (slaFilter === "ok"      && !(days !== null && days > 3))                return false;
        if (slaFilter === "warning" && !(days !== null && days >= 0 && days <= 3))  return false;
        if (slaFilter === "late"    && !(days !== null && days < 0))                return false;
      }
      if (createdStart && r.created_at.slice(0, 10) < createdStart) return false;
      if (createdEnd   && r.created_at.slice(0, 10) > createdEnd)   return false;
      if (deadlineStart && (r.deadline ?? "") < deadlineStart)       return false;
      if (deadlineEnd   && (r.deadline ?? "9999") > deadlineEnd)     return false;
      return true;
    });
  }, [requests, search, statusFilter, typeFilter, migFilter, slaFilter, createdStart, createdEnd, deadlineStart, deadlineEnd, today]);

  // ─── Kanban buckets ───────────────────────────────────────────────────────

  // For migration requests, use migration_status — split into open buckets
  const migrationActive = filtered.filter(r =>
    r.solicitation_type === "migration" &&
    r.migration_status !== "published" &&
    r.migration_status !== "delivered"
  ).sort((a, b) => (a.estimated_delivery_date ?? "9999") < (b.estimated_delivery_date ?? "9999") ? -1 : 1);

  const standardActive = filtered.filter(r => r.solicitation_type !== "migration" && r.status !== "delivered");
  const todayItems = standardActive.filter((r) => r.deadline === today).sort(sortByDeadline);
  const next7Items = standardActive.filter((r) => r.deadline && r.deadline > today && r.deadline <= plus7).sort(sortByDeadline);
  const lateItems  = standardActive.filter((r) => r.deadline && r.deadline < today).sort(sortByDeadline);

  // ─── Table buckets ────────────────────────────────────────────────────────

  const tableRows = tab === "entregues"
    ? filtered.filter((r) => r.status === "delivered" || r.migration_status === "published" || r.migration_status === "delivered")
    : filtered.filter((r) => r.status !== "delivered" && r.migration_status !== "delivered");

  const totalPages    = Math.ceil(tableRows.length / perPage);
  const paginated     = tableRows.slice((page - 1) * perPage, page * perPage);
  const deliveredCount = requests.filter((r) => r.status === "delivered" || r.migration_status === "published" || r.migration_status === "delivered").length;

  const hasFilters = search || statusFilter || typeFilter || migFilter || slaFilter || createdStart || createdEnd || deadlineStart || deadlineEnd;

  function clearFilters() {
    setSearch(""); setStatusFilter(""); setTypeFilter(""); setMigFilter(""); setSlaFilter("");
    setCreatedStart(""); setCreatedEnd(""); setDeadlineStart(""); setDeadlineEnd(""); resetPage();
  }

  // ─── Table ────────────────────────────────────────────────────────────────

  function TableView() {
    if (tableRows.length === 0) {
      return (
        <div className="bg-[hsl(var(--card))] border border-white/8 rounded-xl py-14 text-center text-sm text-white/40">
          Nenhuma solicitação encontrada.
        </div>
      );
    }
    return (
      <div className="bg-[hsl(var(--card))] border border-white/8 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-white/8">
                {[
                  "Nome", "E-mail", "Fazenda", "Cidade/UF",
                  "Tipo / Status Migração", "SLA / Previsão", "Prazo",
                  ...(tab === "entregues" ? ["Publicado"] : []),
                  "Status", "Ações",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => {
                const cs = getCardStatus(r, today);
                const loc = [r.farm_city, r.farm_state].filter(Boolean).join("/") || "—";
                const isMigration = r.solicitation_type === "migration";
                return (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/requests/${r.id}`} className="font-medium text-white hover:underline">
                        {r.user_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">{r.user_email}</td>
                    <td className="px-4 py-3 text-xs text-white/60">{r.farm_name}</td>
                    <td className="px-4 py-3 text-xs text-white/45">{loc}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {isMigration ? (
                          <>
                            <MigrationBadge />
                            {r.migration_source && <MigrationSourceBadge source={r.migration_source} />}
                            {r.migration_status && <MigrationStatusBadge status={r.migration_status} />}
                            {r.migration_assignee_role && (
                              <span className="text-[10px] text-white/40 capitalize">{r.migration_assignee_role.replace(/_/g, " ")}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-white/50">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isMigration ? (
                        <div className="flex flex-col gap-1">
                          <SlaBadge estimatedDate={r.estimated_delivery_date} migStatus={r.migration_status} />
                          <span className="text-xs text-white/40">{formatDateBR(r.estimated_delivery_date)}</span>
                        </div>
                      ) : (
                        <span className={`text-xs ${cs === "late" ? "text-red-400 font-medium" : "text-white/45"}`}>
                          {formatDateBR(r.deadline)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {!isMigration && (
                        <span className={cs === "late" ? "text-red-400 font-medium" : "text-white/45"}>
                          {formatDateBR(r.deadline)}
                        </span>
                      )}
                      {isMigration && (
                        <span className="text-white/25 text-[11px]">—</span>
                      )}
                    </td>
                    {tab === "entregues" && (
                      <td className="px-4 py-3 text-xs text-green-400 whitespace-nowrap">
                        {r.migration_published_at
                          ? formatDateBR(r.migration_published_at.slice(0, 10))
                          : r.delivered_at ? formatDateBR(r.delivered_at) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3"><StatusPill cs={cs} /></td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        calendarId={r.calendar_id}
                        onEmailClick={() => showToast("Envio por e-mail será configurado em breve.")}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-white/8 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <span>Por página:</span>
            {([10, 25, 50] as PerPage[]).map((n) => (
              <button
                key={n}
                onClick={() => { setPerPage(n); resetPage(); }}
                className={`w-8 h-7 rounded text-xs ${perPage === n ? "bg-white/10 text-white" : "hover:text-white/70"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span>
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, tableRows.length)} de {tableRows.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:text-white disabled:opacity-25"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded hover:text-white disabled:opacity-25"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const kanbanColumns: { title: string; items: AdminRequestRow[]; Icon: LucideIcon; accent: string }[] = [
    { title: "Hoje",            items: todayItems,      Icon: Clock,           accent: "text-yellow-400" },
    { title: "Próximos 7 dias", items: next7Items,      Icon: CalendarDays,    accent: "text-blue-400" },
    { title: "Atrasadas",       items: lateItems,       Icon: AlertTriangle,   accent: "text-red-400" },
    { title: "Migrações ativas", items: migrationActive, Icon: ArrowRightLeft, accent: "text-blue-400" },
  ];

  return (
    <div className="space-y-5">

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {([
          { key: "kanban",    label: "Kanban",    Icon: LayoutGrid },
          { key: "tabela",    label: "Tabela",    Icon: List },
          { key: "entregues", label: "Entregues", Icon: CheckCircle2 },
        ] as { key: Tab; label: string; Icon: typeof Clock }[]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); resetPage(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-[hsl(var(--red))] text-white"
                : "border-transparent text-white/40 hover:text-white/60"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {key === "entregues" && deliveredCount > 0 && (
              <span className="text-[11px] bg-green-500/15 text-green-400 rounded-full px-1.5 py-0.5 font-semibold">
                {deliveredCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              placeholder="Buscar por nome, e-mail, fazenda ou telefone…"
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={() => exportCSV(filtered, today)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors text-sm whitespace-nowrap"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); resetPage(); }}
            className={inputCls}
          >
            <option value="">Todos os status</option>
            <option value="pending">Aguardando</option>
            <option value="late">Atrasado</option>
            <option value="delivered">Entregue</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as SolicitationType | ""); resetPage(); }}
            className={inputCls}
          >
            <option value="">Todos os tipos</option>
            <option value="standard">Standard</option>
            <option value="migration">Migração</option>
          </select>

          {(typeFilter === "migration" || migFilter) && (
            <select
              value={migFilter}
              onChange={(e) => { setMigFilter(e.target.value as MigrationStatus | ""); resetPage(); }}
              className={inputCls}
            >
              <option value="">Status da migração</option>
              <option value="awaiting_migration">Aguardando</option>
              <option value="in_migration">Em migração</option>
              <option value="internal_review">Revisão interna</option>
              <option value="published">Publicado</option>
              <option value="delivered">Entregue</option>
            </select>
          )}

          {(typeFilter === "migration" || slaFilter) && (
            <select
              value={slaFilter}
              onChange={(e) => { setSlaFilter(e.target.value as SlaFilter); resetPage(); }}
              className={inputCls}
            >
              <option value="">SLA — Todos</option>
              <option value="ok">No prazo (verde)</option>
              <option value="warning">Atenção (≤ 3 dias)</option>
              <option value="late">Atrasado (SLA)</option>
            </select>
          )}

          <label className="flex items-center gap-1.5 text-xs text-white/40 whitespace-nowrap">
            Solicitação:
            <input type="date" value={createdStart}
              onChange={(e) => { setCreatedStart(e.target.value); resetPage(); }}
              className={inputCls}
            />
            <span>–</span>
            <input type="date" value={createdEnd}
              onChange={(e) => { setCreatedEnd(e.target.value); resetPage(); }}
              className={inputCls}
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs text-white/40 whitespace-nowrap">
            Prazo:
            <input type="date" value={deadlineStart}
              onChange={(e) => { setDeadlineStart(e.target.value); resetPage(); }}
              className={inputCls}
            />
            <span>–</span>
            <input type="date" value={deadlineEnd}
              onChange={(e) => { setDeadlineEnd(e.target.value); resetPage(); }}
              className={inputCls}
            />
          </label>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-white/35 border border-white/10 rounded-lg px-3 py-2 hover:text-white/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Kanban */}
      {tab === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {kanbanColumns.map(({ title, items, Icon, accent }) => (
            <div key={title} className="flex-1 min-w-[260px] max-w-sm space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Icon className={`h-4 w-4 flex-shrink-0 ${accent}`} />
                <span className="text-sm font-semibold text-white">{title}</span>
                <span className="ml-auto text-xs font-medium text-white/40 bg-white/5 rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[80px]">
                {items.length === 0 ? (
                  <p className="text-xs text-white/25 text-center py-6">Nenhuma solicitação</p>
                ) : (
                  items.map((r) => <KanbanCard key={r.id} r={r} today={today} />)
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table / Entregues */}
      {(tab === "tabela" || tab === "entregues") && <TableView />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[hsl(var(--card))] border border-white/15 rounded-xl px-4 py-3 text-sm text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}

    </div>
  );
}
