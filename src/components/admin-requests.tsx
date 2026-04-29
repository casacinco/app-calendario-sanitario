"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Clock, AlertTriangle, CalendarDays,
  LayoutGrid, List, CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDateBR } from "@/lib/format";
import type { AdminRequestRow, RequestStatus } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getPlusDaysStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({ r, today }: { r: AdminRequestRow; today: string }) {
  const cs = getCardStatus(r, today);
  const phone = parsePhone(r.raw_responses);
  const location = [r.farm_city, r.farm_state].filter(Boolean).join("/");

  return (
    <div className={`rounded-xl border p-4 space-y-3 bg-white ${
      cs === "late" ? "border-red-500/30" : "border-white/8"
    }`}>
      <div>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="font-semibold text-sm text-gray-900 leading-snug">{r.user_name}</p>
          <StatusPill cs={cs} />
        </div>
        <p className="text-xs text-gray-500">{r.farm_name}</p>
        {location && <p className="text-xs text-gray-400">{location}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3 w-3 text-gray-300 flex-shrink-0" />
          <span className="text-gray-400">Prazo:</span>
          <span className={cs === "late" ? "text-red-500 font-medium" : "text-gray-600"}>
            {formatDateBR(r.deadline)}
          </span>
        </div>
        {phone !== "—" && (
          <p className="text-xs text-gray-400 pl-4">{phone}</p>
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

// ─── Input helpers ────────────────────────────────────────────────────────────

const inputCls =
  "bg-[hsl(var(--card))] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25 placeholder:text-white/25";

// ─── Main ────────────────────────────────────────────────────────────────────

type Tab = "kanban" | "tabela" | "entregues";
type PerPage = 10 | 25 | 50;

export function AdminRequests({ requests }: { requests: AdminRequestRow[] }) {
  // Computed once per render — cheap date ops, no useMemo to avoid T|undefined with noUncheckedIndexedAccess
  const today: string = getTodayStr();
  const plus7: string = getPlusDaysStr(7);

  const [tab,           setTab]           = useState<Tab>("kanban");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<RequestStatus | "late" | "">("");
  const [createdStart,  setCreatedStart]  = useState("");
  const [createdEnd,    setCreatedEnd]    = useState("");
  const [deadlineStart, setDeadlineStart] = useState("");
  const [deadlineEnd,   setDeadlineEnd]   = useState("");
  const [page,          setPage]          = useState(1);
  const [perPage,       setPerPage]       = useState<PerPage>(10);

  function resetPage() { setPage(1); }

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
      if (createdStart && r.created_at.slice(0, 10) < createdStart) return false;
      if (createdEnd   && r.created_at.slice(0, 10) > createdEnd)   return false;
      if (deadlineStart && (r.deadline ?? "") < deadlineStart)       return false;
      if (deadlineEnd   && (r.deadline ?? "9999") > deadlineEnd)     return false;
      return true;
    });
  }, [requests, search, statusFilter, createdStart, createdEnd, deadlineStart, deadlineEnd, today]);

  // ─── Kanban buckets ───────────────────────────────────────────────────────

  const active     = filtered.filter((r) => r.status !== "delivered");
  const todayItems = active.filter((r) => r.deadline === today).sort(sortByDeadline);
  const next7Items = active.filter((r) => r.deadline && r.deadline > today && r.deadline <= plus7).sort(sortByDeadline);
  const lateItems  = active.filter((r) => r.deadline && r.deadline < today).sort(sortByDeadline);

  // ─── Table buckets ────────────────────────────────────────────────────────

  const tableRows     = tab === "entregues"
    ? filtered.filter((r) => r.status === "delivered")
    : filtered.filter((r) => r.status !== "delivered");

  const totalPages    = Math.ceil(tableRows.length / perPage);
  const paginated     = tableRows.slice((page - 1) * perPage, page * perPage);
  const deliveredCount = requests.filter((r) => r.status === "delivered").length;

  const hasFilters = search || statusFilter || createdStart || createdEnd || deadlineStart || deadlineEnd;

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
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-white/8">
                {[
                  "Nome", "E-mail", "Telefone", "Rebanho", "Cidade/UF",
                  "Solicitação", "Prazo",
                  ...(tab === "entregues" ? ["Entrega"] : []),
                  "Status",
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
                const phone = parsePhone(r.raw_responses);
                const loc = [r.farm_city, r.farm_state].filter(Boolean).join("/") || "—";
                return (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/requests/${r.id}`} className="font-medium text-white hover:underline">
                        {r.user_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">{r.user_email}</td>
                    <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">{phone}</td>
                    <td className="px-4 py-3 text-xs text-white/60">{r.farm_name}</td>
                    <td className="px-4 py-3 text-xs text-white/45">{loc}</td>
                    <td className="px-4 py-3 text-xs text-white/45 whitespace-nowrap">{formatDateBR(r.created_at)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={cs === "late" ? "text-red-400 font-medium" : "text-white/45"}>
                        {formatDateBR(r.deadline)}
                      </span>
                    </td>
                    {tab === "entregues" && (
                      <td className="px-4 py-3 text-xs text-green-400 whitespace-nowrap">
                        {r.delivered_at ? formatDateBR(r.delivered_at) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3"><StatusPill cs={cs} /></td>
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
    { title: "Hoje",            items: todayItems, Icon: Clock,         accent: "text-yellow-400" },
    { title: "Próximos 7 dias", items: next7Items, Icon: CalendarDays,  accent: "text-blue-400" },
    { title: "Atrasadas",       items: lateItems,  Icon: AlertTriangle, accent: "text-red-400" },
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Buscar por nome, e-mail, rebanho ou telefone…"
            className={`${inputCls} w-full pl-9`}
          />
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
              onClick={() => {
                setSearch(""); setStatusFilter(""); setCreatedStart(""); setCreatedEnd("");
                setDeadlineStart(""); setDeadlineEnd(""); resetPage();
              }}
              className="text-xs text-white/35 border border-white/10 rounded-lg px-3 py-2 hover:text-white/60 transition-colors"
            >
              Limpar filtros
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

    </div>
  );
}
