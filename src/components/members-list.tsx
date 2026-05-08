"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, Package, ShoppingBag, CalendarDays,
  Infinity as InfinityIcon, Lock, Unlock, RefreshCw,
  ExternalLink, Users, X, Clock,
} from "lucide-react";
import type {
  MemberWithRequest, Member, AdminRequestRow,
  MemberProfile, MemberAccessType,
} from "@/lib/db";
import { formatDateBR } from "@/lib/format";

// ─── Display status ───────────────────────────────────────────────────────────

type DisplayStatus = "active" | "expiring" | "blocked" | "lifetime" | "support" | "admin";

function getDisplayStatus(m: MemberWithRequest): DisplayStatus {
  if (m.profile === "admin")   return "admin";
  if (m.profile === "support") return "support";
  const isBlocked = m.status === "blocked" || (m.status as string) === "inactive";
  if (isBlocked) return "blocked";
  if (m.access_type === "lifetime") return "lifetime";
  if (m.expires_at) {
    const days = Math.ceil((new Date(m.expires_at).getTime() - Date.now()) / 86400000);
    if (days <= 0)  return "blocked";
    if (days <= 30) return "expiring";
  }
  return "active";
}

function getDaysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

// ─── Status config ────────────────────────────────────────────────────────────

const SC: Record<DisplayStatus, { label: string; badge: string; bar: string; avatar: string }> = {
  active:   { label: "Ativo",      badge: "bg-green/15 text-green border-green/30",                      bar: "bg-green",       avatar: "bg-green/20 text-green" },
  expiring: { label: "Expirando",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",       bar: "bg-yellow-500",  avatar: "bg-yellow-500/20 text-yellow-400" },
  blocked:  { label: "Bloqueado",  badge: "bg-red/15 text-red border-red/30",                            bar: "bg-red",         avatar: "bg-red/20 text-red" },
  lifetime: { label: "Vitalício",  badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",             bar: "bg-blue-500",    avatar: "bg-blue-500/20 text-blue-400" },
  support:  { label: "Suporte",    badge: "bg-purple-500/15 text-purple-400 border-purple-500/25",       bar: "bg-purple-500",  avatar: "bg-purple-500/20 text-purple-400" },
  admin:    { label: "Admin",      badge: "bg-text/10 text-text-muted border-border",                    bar: "bg-text-muted",  avatar: "bg-text/10 text-text-muted" },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, status }: { name: string; status: DisplayStatus }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${SC[status].avatar}`}>
      {initials}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${SC[status].badge}`}>
      {SC[status].label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-0.5">
      <span className={`text-2xl font-bold tabular-nums ${accent ?? "text-text"}`}>{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  onClick, disabled, loading, danger, success, children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  success?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 whitespace-nowrap
        ${danger   ? "border-red/30 text-red hover:bg-red/10" :
          success  ? "border-green/30 text-green hover:bg-green/10" :
          "border-border text-text-muted hover:bg-text/5 hover:text-text"}`}
    >
      {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : children}
    </button>
  );
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const INPUT    = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT   = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const TEXTAREA = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors resize-none";

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onUpdate,
}: {
  member: MemberWithRequest;
  onUpdate: (updated: Member) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const ds      = getDisplayStatus(member);
  const daysLeft = getDaysLeft(member.expires_at);

  async function call(action: string, url: string, body?: object) {
    setLoading(action);
    setErr(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json<{ member?: Member; error?: string }>();
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      onUpdate(data.member!);
    } catch {
      setErr("Erro de conexão");
    } finally {
      setLoading(null);
    }
  }

  const extend = (days: number) => call(`+${days}d`, `/api/admin/members/${member.id}/extend`, { days });
  const makeLifetime = () => call("lifetime", `/api/admin/members/${member.id}/extend`, { type: "lifetime" });
  const toggle = () => call("toggle", `/api/admin/members/${member.id}/toggle`);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Status accent bar */}
      <div className={`h-0.5 ${SC[ds].bar}`} />

      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Avatar name={member.name} status={ds} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text leading-snug">{member.name}</p>
              <p className="text-xs text-text-muted truncate">{member.email}</p>
              {member.phone && <p className="text-xs text-text-muted">{member.phone}</p>}
            </div>
            <StatusBadge status={ds} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-4 space-y-2 text-xs border-t border-border pt-3">
        {member.product && (
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span className="text-text font-medium">{member.product}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted">
          {member.origin && (
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              {member.origin}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Entrada {formatDateBR(member.entry_date)}
          </span>
        </div>

        {/* Expiry / lifetime */}
        {ds === "lifetime" ? (
          <div className="flex items-center gap-1.5 text-blue-400">
            <InfinityIcon className="h-3.5 w-3.5" />
            Acesso vitalício
          </div>
        ) : member.expires_at ? (
          <div className={`flex items-center gap-1.5 ${
            daysLeft !== null && daysLeft <= 0  ? "text-red" :
            daysLeft !== null && daysLeft <= 30 ? "text-yellow-400" :
            "text-text-muted"
          }`}>
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {daysLeft !== null && daysLeft <= 0
              ? `Acesso expirado · ${formatDateBR(member.expires_at)}`
              : `Expira em ${daysLeft}d · ${formatDateBR(member.expires_at)}`}
          </div>
        ) : null}

        {/* Calendar link */}
        {(member.calendar_id || member.calendar_request_id) && (
          <div className="flex items-center gap-1.5 text-text-muted pt-0.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {member.calendar_id ? (
              <Link href={`/admin/calendarios/${member.calendar_id}`} className="hover:text-text underline underline-offset-2">
                Ver calendário ↗
              </Link>
            ) : (
              <Link href={`/admin/requests/${member.calendar_request_id}`} className="hover:text-text underline underline-offset-2">
                Ver solicitação ↗
              </Link>
            )}
          </div>
        )}

        {err && <p className="text-red pt-1">{err}</p>}
      </div>

      {/* Quick actions */}
      <div className="px-4 py-3 border-t border-border bg-bg/30 flex flex-wrap gap-1.5">
        <ActionBtn onClick={() => extend(30)}  loading={loading === "+30d"}    disabled={!!loading}>+30d</ActionBtn>
        <ActionBtn onClick={() => extend(90)}  loading={loading === "+90d"}    disabled={!!loading}>+90d</ActionBtn>
        <ActionBtn onClick={() => extend(365)} loading={loading === "+365d"}   disabled={!!loading}>+365d</ActionBtn>
        <ActionBtn onClick={makeLifetime}      loading={loading === "lifetime"} disabled={!!loading || ds === "lifetime"}>
          <InfinityIcon className="h-3 w-3" /> Vitalício
        </ActionBtn>
        <ActionBtn
          onClick={toggle}
          loading={loading === "toggle"}
          disabled={!!loading}
          danger={ds !== "blocked"}
          success={ds === "blocked"}
        >
          {ds === "blocked"
            ? <><Unlock className="h-3 w-3" /> Desbloquear</>
            : <><Lock   className="h-3 w-3" /> Bloquear</>}
        </ActionBtn>
        <Link
          href={`/admin/usuarios/${member.id}`}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border text-text-muted hover:bg-text/5 hover:text-text transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> Editar
        </Link>
      </div>
    </div>
  );
}

// ─── New member modal ─────────────────────────────────────────────────────────

function NewMemberModal({
  requests,
  onClose,
  onCreated,
}: {
  requests: AdminRequestRow[];
  onClose: () => void;
  onCreated: (member: MemberWithRequest) => void;
}) {
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [profile, setProfile]           = useState<MemberProfile>("user");
  const [accessType, setAccessType]     = useState<MemberAccessType>("30d");
  const [product, setProduct]           = useState("");
  const [origin, setOrigin]             = useState("Manual");
  const [requestSearch, setRequestSearch] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [notes, setNotes]               = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const DAYS_MAP: Record<MemberAccessType, number | null> = {
    "30d": 30, "90d": 90, "365d": 365, "lifetime": null,
  };

  const filteredRequests = useMemo(() => {
    const q = requestSearch.trim().toLowerCase();
    if (!q) return requests.slice(0, 8);
    return requests
      .filter(r =>
        r.user_name.toLowerCase().includes(q) ||
        r.farm_name.toLowerCase().includes(q) ||
        String(r.id).includes(q),
      )
      .slice(0, 8);
  }, [requests, requestSearch]);

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  async function handleSave() {
    if (!name.trim())  { setError("Nome é obrigatório"); return; }
    if (!email.trim()) { setError("E-mail é obrigatório"); return; }
    setSaving(true);
    setError(null);

    const days = DAYS_MAP[accessType];
    const today = new Date();
    const expiresAt = days !== null
      ? (() => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; })()
      : null;

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          profile,
          access_type: accessType,
          expires_at: expiresAt,
          product: product.trim() || null,
          origin: origin || null,
          notes: notes.trim() || null,
          calendar_request_id: selectedRequestId,
          entry_date: today.toISOString().split("T")[0],
        }),
      });
      const data = await res.json<{ member?: MemberWithRequest; error?: string }>();
      if (!res.ok) { setError(data.error ?? "Erro ao criar usuário"); return; }
      onCreated(data.member!);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text">Novo usuário</h2>
            <p className="text-xs text-text-muted mt-0.5">Cadastrar aluno ou produtor no sistema</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nome *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className={INPUT} autoFocus />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">E-mail *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Telefone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Perfil</label>
              <select value={profile} onChange={e => setProfile(e.target.value as MemberProfile)} className={SELECT}>
                <option value="user">Usuário</option>
                <option value="support">Suporte</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Tipo de acesso</label>
              <select value={accessType} onChange={e => setAccessType(e.target.value as MemberAccessType)} className={SELECT}>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
                <option value="365d">365 dias</option>
                <option value="lifetime">Vitalício</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Produto principal</label>
              <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Calendário Sanitário VPC" className={INPUT} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Origem da compra</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} className={SELECT}>
                <option value="Manual">Manual</option>
                <option value="Hotmart">Hotmart</option>
                <option value="Kiwify">Kiwify</option>
                <option value="PerfectPay">PerfectPay</option>
                <option value="Eduzz">Eduzz</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Calendar selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Vincular calendário</label>
            {selectedRequest ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{selectedRequest.user_name}</p>
                  <p className="text-xs text-text-muted truncate">
                    {selectedRequest.farm_name} · Sol. #{selectedRequest.id}
                    {selectedRequest.calendar_id ? ` · Cal. #${selectedRequest.calendar_id}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedRequestId(null); setRequestSearch(""); }}
                  className="text-text-muted hover:text-text shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                <input
                  value={requestSearch}
                  onChange={e => setRequestSearch(e.target.value)}
                  placeholder="Buscar por produtor ou nome do rebanho..."
                  className={`${INPUT} pl-9`}
                />
                {requestSearch && filteredRequests.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                    {filteredRequests.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setSelectedRequestId(r.id); setRequestSearch(""); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-text/5 transition-colors border-b border-border last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{r.user_name}</p>
                          <p className="text-xs text-text-muted truncate">
                            {r.farm_name} · Sol. #{r.id}
                            {r.calendar_id ? ` · Cal. #${r.calendar_id}` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Observação interna</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas internas sobre este usuário..." className={TEXTAREA} />
          </div>

          {error && <p className="text-sm text-red">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-sm px-4 h-9 rounded-md border border-border hover:bg-text/5 transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-5 h-9 rounded-md bg-text text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FilterKey = "all" | DisplayStatus;

export function MembersList({
  members: initial,
  requests,
}: {
  members: MemberWithRequest[];
  requests: AdminRequestRow[];
}) {
  const [members, setMembers] = useState<MemberWithRequest[]>(initial);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [showModal, setShowModal] = useState(false);

  const withStatus = useMemo(
    () => members.map(m => ({ m, ds: getDisplayStatus(m) })),
    [members],
  );

  const stats = useMemo(() => ({
    total:    members.length,
    active:   withStatus.filter(x => x.ds === "active").length,
    expiring: withStatus.filter(x => x.ds === "expiring").length,
    blocked:  withStatus.filter(x => x.ds === "blocked").length,
    lifetime: withStatus.filter(x => x.ds === "lifetime").length,
  }), [members, withStatus]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withStatus
      .filter(({ m, ds }) => {
        if (filter !== "all" && ds !== filter) return false;
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          (m.phone ?? "").toLowerCase().includes(q)
        );
      })
      .map(({ m }) => m);
  }, [withStatus, search, filter]);

  function onUpdate(updated: Member) {
    setMembers(prev =>
      prev.map(m => m.id === updated.id ? { ...m, ...updated } as MemberWithRequest : m),
    );
  }

  function onCreated(m: MemberWithRequest) {
    setMembers(prev => [m, ...prev]);
    setShowModal(false);
  }

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",      label: "Todos",      count: stats.total },
    { key: "active",   label: "Ativos",     count: stats.active },
    { key: "expiring", label: "Expirando",  count: stats.expiring },
    { key: "blocked",  label: "Bloqueados", count: stats.blocked },
    { key: "lifetime", label: "Vitalícios", count: stats.lifetime },
  ];

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={stats.total}    label="Total" />
        <StatCard value={stats.active}   label="Ativos"     accent="text-green" />
        <StatCard value={stats.expiring} label="Expirando"  accent="text-yellow-400" />
        <StatCard value={stats.blocked}  label="Bloqueados" accent="text-red" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full h-9 rounded-md border border-border bg-bg pl-9 pr-3 text-sm focus:outline-none focus:border-text-muted transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-text text-bg text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="h-4 w-4" /> Novo usuário
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              filter === key
                ? "border-text text-text font-medium"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {search || filter !== "all"
              ? "Nenhum usuário encontrado para esse filtro."
              : "Nenhum usuário cadastrado ainda."}
          </p>
          {!search && filter === "all" && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text border border-border rounded-md px-4 h-9 transition-colors"
            >
              <Plus className="h-4 w-4" /> Cadastrar primeiro usuário
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(m => (
            <MemberCard key={m.id} member={m} onUpdate={onUpdate} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewMemberModal
          requests={requests}
          onClose={() => setShowModal(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}
