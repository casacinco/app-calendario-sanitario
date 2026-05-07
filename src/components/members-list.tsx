"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, UserCheck, UserX, Plus } from "lucide-react";
import type { MemberWithRequest, MemberStatus } from "@/lib/db";
import { formatDateBR } from "@/lib/format";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MemberStatus }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-green/15 text-green border border-green/30">
      <UserCheck className="h-3 w-3" /> Ativo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-text-muted/10 text-text-muted border border-border">
      <UserX className="h-3 w-3" /> Inativo
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MembersList({ members }: { members: MemberWithRequest[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MemberStatus>("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, search, statusFilter]);

  const counts = useMemo(
    () => ({
      all: members.length,
      active: members.filter((m) => m.status === "active").length,
      inactive: members.filter((m) => m.status === "inactive").length,
    }),
    [members],
  );

  const tabs: { key: "all" | MemberStatus; label: string; count: number }[] = [
    { key: "all",      label: "Todos",    count: counts.all },
    { key: "active",   label: "Ativos",   count: counts.active },
    { key: "inactive", label: "Inativos", count: counts.inactive },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full h-9 rounded-md border border-border bg-bg pl-9 pr-3 text-sm focus:outline-none focus:border-text-muted"
          />
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-text text-bg text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="h-4 w-4" /> Novo usuário
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              statusFilter === key
                ? "border-text text-text font-medium"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-text-muted">({count})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {search || statusFilter !== "all"
            ? "Nenhum usuário encontrado para esse filtro."
            : "Nenhum usuário cadastrado ainda."}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-text/[0.02] border-b border-border text-xs text-text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">E-mail</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Produto</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Entrada</th>
                <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">Calendário</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-text/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text leading-snug">{m.name}</div>
                    <div className="text-xs text-text-muted md:hidden">{m.email}</div>
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">{m.email}</td>
                  <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{m.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{m.product ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {formatDateBR(m.entry_date)}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {m.calendar_id ? (
                      <Link
                        href={`/admin/calendarios/${m.calendar_id}`}
                        className="text-xs text-text-muted hover:text-text underline underline-offset-2"
                      >
                        Ver calendário ↗
                      </Link>
                    ) : m.calendar_request_id ? (
                      <Link
                        href={`/admin/requests/${m.calendar_request_id}`}
                        className="text-xs text-text-muted hover:text-text underline underline-offset-2"
                      >
                        Ver solicitação ↗
                      </Link>
                    ) : (
                      <span className="text-xs text-text-muted/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/usuarios/${m.id}`}
                      className="text-xs text-text-muted hover:text-text border border-border rounded-md px-2.5 py-1 transition-colors"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
