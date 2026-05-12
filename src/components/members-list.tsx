"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search, Plus, CalendarDays,
  Infinity as InfinityIcon, Lock, Unlock, RefreshCw,
  ExternalLink, Users, X, Clock, Mail, KeyRound,
  Eye, EyeOff, Copy, Check, MonitorSmartphone,
  Download, Printer, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal,
  History, ArrowRightLeft,
} from "lucide-react";
import type {
  MemberWithRequest, Member, AdminRequestRow,
  MemberProfile, MemberAccessType, MemberEvent,
} from "@/lib/db";
import { formatDateBR } from "@/lib/format";

// ─── Display status (member access) ──────────────────────────────────────────

type DisplayStatus =
  | "active" | "expiring" | "blocked" | "lifetime" | "support" | "admin"
  | "refunded" | "chargedback" | "expired" | "canceled";
type InlineMode    = "email" | "password" | null;

function getDisplayStatus(m: MemberWithRequest): DisplayStatus {
  if (m.profile === "admin")   return "admin";
  if (m.profile === "support") return "support";
  // Sub-status de assinatura tem prioridade sobre o status de acesso
  const sub = m.subscription_status as string;
  if (sub === "refunded")    return "refunded";
  if (sub === "chargedback") return "chargedback";
  if (sub === "expired")     return "expired";
  if (sub === "canceled")    return "canceled";
  if (m.status === "blocked" || (m.status as string) === "inactive") return "blocked";
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

function generatePassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

// ─── Calendar status ──────────────────────────────────────────────────────────

type CalendarStatusKey =
  | "not_started"
  | "awaiting_form"
  | "requested"
  | "in_production"
  | "published"
  | "delivered";

const CSC: Record<CalendarStatusKey, { label: string; badge: string; dot: string }> = {
  not_started:   { label: "Não iniciado",             badge: "bg-white/5 text-white/40 border-white/10",                       dot: "bg-white/30" },
  awaiting_form: { label: "Aguardando preenchimento",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",          dot: "bg-yellow-500" },
  requested:     { label: "Solicitação criada",        badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",                dot: "bg-blue-500" },
  in_production: { label: "Em produção",               badge: "bg-orange-500/15 text-orange-400 border-orange-500/25",          dot: "bg-orange-400" },
  published:     { label: "Publicado",                 badge: "bg-green/15 text-green border-green/30",                         dot: "bg-green" },
  delivered:     { label: "Entregue",                  badge: "bg-emerald-400/15 text-emerald-400 border-emerald-400/25",       dot: "bg-emerald-400" },
};

function getCalendarStatus(m: MemberWithRequest): CalendarStatusKey {
  if (m.request_status === "delivered")                         return "delivered";
  if (m.calendar_id && m.cal_status === "published")            return "published";
  if (m.calendar_id)                                            return "in_production";
  if (m.calendar_request_id)                                    return "requested";
  if (m.onboarding_completed)                                   return "awaiting_form";
  return "not_started";
}

// ─── Status config (member access) ───────────────────────────────────────────

const SC: Record<DisplayStatus, { label: string; badge: string; bar: string; avatar: string }> = {
  active:      { label: "Ativo",       badge: "bg-green/15 text-green border-green/30",                    bar: "bg-green",        avatar: "bg-green/20 text-green" },
  expiring:    { label: "Expirando",   badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",     bar: "bg-yellow-500",   avatar: "bg-yellow-500/20 text-yellow-400" },
  blocked:     { label: "Bloqueado",   badge: "bg-red/15 text-red border-red/30",                          bar: "bg-red",          avatar: "bg-red/20 text-red" },
  lifetime:    { label: "Vitalício",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",           bar: "bg-blue-500",     avatar: "bg-blue-500/20 text-blue-400" },
  support:     { label: "Suporte",     badge: "bg-purple-500/15 text-purple-400 border-purple-500/25",     bar: "bg-purple-500",   avatar: "bg-purple-500/20 text-purple-400" },
  admin:       { label: "Admin",       badge: "bg-text/10 text-text-muted border-border",                  bar: "bg-text-muted",   avatar: "bg-text/10 text-text-muted" },
  refunded:    { label: "Reembolsado", badge: "bg-orange-500/15 text-orange-400 border-orange-500/25",     bar: "bg-orange-500",   avatar: "bg-orange-500/20 text-orange-400" },
  chargedback: { label: "Chargeback",  badge: "bg-red/15 text-red border-red/30",                          bar: "bg-red",          avatar: "bg-red/20 text-red" },
  expired:     { label: "Expirado",    badge: "bg-text/10 text-text-muted border-border",                  bar: "bg-text-muted",   avatar: "bg-text/10 text-text-muted" },
  canceled:    { label: "Cancelado",   badge: "bg-text/10 text-text-muted border-border",                  bar: "bg-text-muted",   avatar: "bg-text/10 text-text-muted" },
};

const PROFILE_LABELS: Record<MemberProfile, string> = {
  user: "Usuário", support: "Suporte", admin: "Admin",
};

const ACCESS_LABELS: Record<MemberAccessType, string> = {
  "30d": "30 dias", "90d": "90 dias", "365d": "365 dias", "lifetime": "Vitalício",
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function Avatar({ name, status }: { name: string; status: DisplayStatus }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${SC[status].avatar}`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${SC[status].badge}`}>
      {SC[status].label}
    </span>
  );
}

function ProfileBadge({ profile }: { profile: MemberProfile }) {
  return (
    <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border border-border bg-text/5 text-text-muted">
      {PROFILE_LABELS[profile]}
    </span>
  );
}

function CalendarStatusBadge({ status }: { status: CalendarStatusKey }) {
  const cfg = CSC[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-text-muted font-medium">{label}</p>
      <p className="text-xs text-text mt-0.5 truncate">{value ?? "—"}</p>
    </div>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-0.5">
      <span className={`text-2xl font-bold tabular-nums ${accent ?? "text-text"}`}>{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function Btn({ onClick, disabled, title, children }: {
  onClick?: () => void; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border text-text-muted hover:bg-text/5 hover:text-text transition-colors disabled:opacity-40 whitespace-nowrap">
      {children}
    </button>
  );
}

function BtnDanger({ onClick, disabled, title, children }: {
  onClick?: () => void; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-red/30 text-red hover:bg-red/10 transition-colors disabled:opacity-40 whitespace-nowrap">
      {children}
    </button>
  );
}

function BtnSuccess({ onClick, disabled, title, children }: {
  onClick?: () => void; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-green/30 text-green hover:bg-green/10 transition-colors disabled:opacity-40 whitespace-nowrap">
      {children}
    </button>
  );
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const INPUT    = "h-8 w-full rounded border border-border bg-bg px-2.5 text-sm focus:outline-none focus:border-text-muted transition-colors";
const INPUT_LG = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT   = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const TEXTAREA = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors resize-none";

// ─── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmAction {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "green" | "red" | "neutral";
  execute: () => Promise<void>;
}

function ConfirmModal({ action, onClose }: { action: ConfirmAction; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !loading) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  async function handleConfirm() {
    setLoading(true); setError(null);
    try { await action.execute(); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao executar ação"); }
    finally  { setLoading(false); }
  }

  const confirmBtnClass =
    action.variant === "red"   ? "bg-red text-white hover:opacity-90" :
    action.variant === "green" ? "bg-green text-white hover:opacity-90" :
    "bg-text text-bg hover:opacity-90";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${visible ? "bg-black/60" : "bg-black/0"}`}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className={`bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm transition-all duration-200 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <div className="flex items-start justify-between px-6 pt-5 pb-3 gap-3">
          <h2 className="text-base font-semibold text-text leading-snug">{action.title}</h2>
          <button type="button" onClick={onClose} disabled={loading}
            className="text-text-muted hover:text-text p-0.5 transition-colors shrink-0 disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 pb-5 space-y-3">
          <p className="text-sm text-text-muted leading-relaxed">{action.message}</p>
          {error && <p className="text-xs text-red bg-red/10 border border-red/20 rounded-md px-3 py-2">{error}</p>}
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={loading}
            className="text-sm px-4 h-9 rounded-md border border-border text-text-muted hover:bg-text/5 transition-colors disabled:opacity-40">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} disabled={loading}
            className={`text-sm px-5 h-9 rounded-md font-medium transition-opacity disabled:opacity-50 flex items-center gap-2 ${confirmBtnClass}`}>
            {loading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Aguarde…</> : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({ member, onUpdate }: { member: MemberWithRequest; onUpdate: (u: Member) => void }) {
  const [feedback, setFeedback]         = useState<string | null>(null);
  const [inlineMode, setInlineMode]     = useState<InlineMode>(null);
  const [inlineVal, setInlineVal]       = useState("");
  const [inlineConf, setInlineConf]     = useState("");
  const [inlineErr, setInlineErr]       = useState<string | null>(null);
  const [inlineLoad, setInlineLoad]     = useState(false);
  const [showPwd, setShowPwd]           = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);
  const [showHistory, setShowHistory]   = useState(false);
  const [historyData, setHistoryData]   = useState<MemberEvent[] | null>(null);
  const [historyLoad, setHistoryLoad]   = useState(false);

  async function loadHistory() {
    if (historyData !== null) { setShowHistory(s => !s); return; }
    setHistoryLoad(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}/events`);
      const json = await res.json<{ events: MemberEvent[] }>();
      setHistoryData(json.events ?? []);
      setShowHistory(true);
    } catch {
      setHistoryData([]);
      setShowHistory(true);
    } finally {
      setHistoryLoad(false);
    }
  }

  const ds        = getDisplayStatus(member);
  const calStatus = getCalendarStatus(member);
  const daysLeft  = getDaysLeft(member.expires_at);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  function openInline(mode: InlineMode) {
    setInlineMode(mode);
    setInlineVal(mode === "email" ? member.email : "");
    setInlineConf(""); setInlineErr(null);
  }

  function closeInline() {
    setInlineMode(null); setInlineVal(""); setInlineConf(""); setInlineErr(null);
  }

  async function apiExtend(days?: number, type?: "lifetime") {
    const body = type === "lifetime" ? { type } : { days };
    const res = await fetch(`/api/admin/members/${member.id}/extend`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json<{ member?: Member; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    onUpdate(data.member!);
  }

  async function apiToggle() {
    const res = await fetch(`/api/admin/members/${member.id}/toggle`, { method: "POST" });
    const data = await res.json<{ member?: Member; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    onUpdate(data.member!);
  }

  async function saveInlineActual() {
    const body = inlineMode === "email" ? { email: inlineVal.trim() } : { password: inlineVal };
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json<{ member?: Member; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    onUpdate(data.member!); closeInline();
    flash(inlineMode === "email" ? "E-mail atualizado" : "Senha atualizada");
  }

  function requestSaveInline() {
    if (inlineMode === "email") {
      if (!inlineVal.trim()) { setInlineErr("E-mail é obrigatório"); return; }
    } else {
      if (!inlineVal.trim()) { setInlineErr("Senha é obrigatória"); return; }
      if (inlineVal !== inlineConf) { setInlineErr("As senhas não coincidem"); return; }
    }
    setPendingAction({
      title: inlineMode === "email" ? "Alterar e-mail do usuário?" : "Alterar senha do usuário?",
      message: inlineMode === "email"
        ? `O e-mail de ${member.name} será alterado para ${inlineVal.trim()}.`
        : `A senha de acesso de ${member.name} será redefinida.`,
      confirmLabel: "Confirmar alteração",
      variant: "neutral",
      execute: saveInlineActual,
    });
  }

  function subscriptionLabel(): string {
    if (member.access_type === "lifetime") return "Vitalício";
    if (member.status === "blocked")       return "Bloqueado";
    if (!member.expires_at)                return "—";
    const d = getDaysLeft(member.expires_at);
    if (d !== null && d <= 0)  return "Expirado";
    if (d !== null && d <= 30) return "Expirando";
    return "Ativo";
  }

  const firstName = member.name.split(" ")[0];

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={`h-0.5 ${SC[ds].bar}`} />

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3 flex items-start gap-3">
          <Avatar name={member.name} status={ds} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-text leading-snug">{member.name}</span>
              <ProfileBadge profile={member.profile ?? "user"} />
              <StatusBadge status={ds} />
            </div>
            <p className="text-xs text-text-muted mt-0.5">{member.email}</p>
            {member.phone && <p className="text-xs text-text-muted">{member.phone}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" title="Copiar e-mail"
              onClick={() => navigator.clipboard.writeText(member.email).then(() => flash("E-mail copiado"))}
              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-text/5 transition-colors">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Link href={`/admin/usuarios/${member.id}`} title="Abrir página de edição"
              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-text/5 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Info grid ────────────────────────────────────────────────────── */}
        <div className="px-5 pb-4 border-t border-border pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            <InfoCell label="Produto"         value={member.product} />
            <InfoCell label="Último acesso"   value={member.last_access ? formatDateBR(member.last_access) : null} />
            <InfoCell label="Origem"          value={member.origin} />
            <InfoCell label="Perfil"          value={PROFILE_LABELS[member.profile ?? "user"]} />
            <InfoCell label="Data de entrada" value={formatDateBR(member.entry_date)} />
            <InfoCell label="Tipo de acesso"  value={ACCESS_LABELS[member.access_type ?? "30d"]} />
          </div>

          {/* ── Access countdown ──────────────────────────────────────────── */}
          <div className="mt-3 pt-3 border-t border-border/50">
            {member.access_type === "lifetime" ? (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <InfinityIcon className="h-3.5 w-3.5" />
                <span className="font-medium">Acesso vitalício</span>
              </div>
            ) : member.expires_at ? (
              <div className={`flex items-center justify-between gap-2 text-xs ${
                daysLeft !== null && daysLeft <= 0  ? "text-red" :
                daysLeft !== null && daysLeft <= 30 ? "text-yellow-400" : "text-text-muted"
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {daysLeft !== null && daysLeft <= 0 ? (
                    <span>Acesso expirado · {formatDateBR(member.expires_at)}</span>
                  ) : (
                    <span><strong className="text-text">{daysLeft} dias restantes</strong> · expira {formatDateBR(member.expires_at)}</span>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  daysLeft !== null && daysLeft <= 0  ? "bg-red/10 text-red border-red/30" :
                  daysLeft !== null && daysLeft <= 30 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" :
                  "bg-green/10 text-green border-green/30"
                }`}>{subscriptionLabel()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock className="h-3.5 w-3.5" /><span>Sem data de expiração configurada</span>
              </div>
            )}
          </div>

          {/* ── Calendar status ────────────────────────────────────────────── */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <span className="text-[10px] uppercase tracking-wide text-text-muted font-medium">Calendário</span>
              </div>
              <CalendarStatusBadge status={calStatus} />
            </div>
            {calStatus === "delivered" && member.cal_published_at && (
              <p className="text-xs text-text-muted mt-1.5 pl-5">
                Entrega: <span className="text-text font-medium">{formatDateBR(member.cal_published_at)}</span>
              </p>
            )}
          </div>

          {/* ── Dados de compra (somente quando vem de plataforma externa) ── */}
          {member.platform && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-text-muted font-medium">Compra</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {member.platform}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {member.product_name && (
                  <div className="col-span-2 min-w-0">
                    <p className="text-[10px] text-text-muted">Produto</p>
                    <p className="text-xs text-text truncate">{member.product_name}</p>
                  </div>
                )}
                {member.purchase_date && (
                  <div>
                    <p className="text-[10px] text-text-muted">Compra</p>
                    <p className="text-xs text-text">{formatDateBR(member.purchase_date)}</p>
                  </div>
                )}
                {member.subscription_status && member.subscription_status !== "active" && (
                  <div>
                    <p className="text-[10px] text-text-muted">Assinatura</p>
                    <p className={`text-xs font-medium ${
                      member.subscription_status === "canceled"    ? "text-text-muted" :
                      member.subscription_status === "refunded"    ? "text-orange-400" :
                      member.subscription_status === "chargedback" ? "text-red"        :
                      member.subscription_status === "expired"     ? "text-text-muted" :
                      "text-text"
                    }`}>{SC[member.subscription_status as DisplayStatus]?.label ?? member.subscription_status}</p>
                  </div>
                )}
                {member.payment_status && member.payment_status !== "approved" && (
                  <div>
                    <p className="text-[10px] text-text-muted">Pagamento</p>
                    <p className={`text-xs font-medium ${
                      member.payment_status === "refunded"    ? "text-orange-400" :
                      member.payment_status === "chargedback" ? "text-red"        :
                      member.payment_status === "pending"     ? "text-yellow-400" :
                      "text-text"
                    }`}>{member.payment_status}</p>
                  </div>
                )}
                {member.last_event_received_at && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-text-muted">Último evento</p>
                    <p className="text-xs text-text-muted">
                      {formatDateBR(member.last_event_received_at.split("T")[0])}
                      {member.last_event_received_at.includes("T") && (
                        <span className="ml-1">{member.last_event_received_at.split("T")[1]?.slice(0, 5)}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              {member.transaction_id && (
                <p className="text-[10px] text-text-muted/50 font-mono truncate">
                  txn: {member.transaction_id}
                </p>
              )}
            </div>
          )}

          {/* ── Histórico Hotmart ─────────────────────────────────────────── */}
          {member.platform && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={loadHistory}
                disabled={historyLoad}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-text-muted font-medium hover:text-text transition-colors"
              >
                {historyLoad
                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                  : <History className="h-3 w-3" />
                }
                Histórico de eventos
                <ChevronDown className={`h-3 w-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </button>
              {showHistory && historyData !== null && (
                <div className="mt-2 space-y-1">
                  {historyData.length === 0 ? (
                    <p className="text-[10px] text-text-muted/50 italic pl-0.5">Nenhum evento registrado.</p>
                  ) : (
                    historyData.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-text capitalize">
                            {ev.event_type.replace(/_/g, " ")}
                            {ev.action_taken && (
                              <span className="ml-1 text-text-muted/60 font-normal">→ {ev.action_taken}</span>
                            )}
                          </p>
                          {ev.transaction_id && (
                            <p className="text-[9px] text-text-muted/40 font-mono truncate">{ev.transaction_id}</p>
                          )}
                        </div>
                        <time className="text-[9px] text-text-muted/50 whitespace-nowrap flex-shrink-0">
                          {new Date(ev.created_at).toLocaleString("pt-BR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Device info ───────────────────────────────────────────────── */}
          {member.device_info && (
            <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
              <MonitorSmartphone className="h-3.5 w-3.5 shrink-0" />
              <span>{member.device_info}</span>
            </div>
          )}

          {/* ── Feedback toast ─────────────────────────────────────────────── */}
          {feedback && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green">
              <Check className="h-3.5 w-3.5" /> {feedback}
            </div>
          )}
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border bg-bg/30 space-y-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <BtnSuccess onClick={() => setPendingAction({ title: "Adicionar 30 dias de acesso?", message: `Você está prestes a adicionar 30 dias de acesso para ${firstName}.`, confirmLabel: "Adicionar 30 dias", variant: "green", execute: () => apiExtend(30) })}>+30d</BtnSuccess>
            <BtnSuccess onClick={() => setPendingAction({ title: "Adicionar 90 dias de acesso?", message: `Você está prestes a adicionar 90 dias de acesso para ${firstName}.`, confirmLabel: "Adicionar 90 dias", variant: "green", execute: () => apiExtend(90) })}>+90d</BtnSuccess>
            <BtnSuccess onClick={() => setPendingAction({ title: "Adicionar 365 dias de acesso?", message: `Você está prestes a adicionar 365 dias de acesso para ${firstName}.`, confirmLabel: "Adicionar 365 dias", variant: "green", execute: () => apiExtend(365) })}>+365d</BtnSuccess>
            <BtnSuccess disabled={ds === "lifetime"} onClick={() => setPendingAction({ title: "Tornar acesso vitalício?", message: `O acesso de ${firstName} se tornará vitalício, sem data de expiração.`, confirmLabel: "Tornar vitalício", variant: "green", execute: () => apiExtend(undefined, "lifetime") })}>
              <InfinityIcon className="h-3 w-3" /> Vitalício
            </BtnSuccess>

            <span className="text-border text-xs select-none">|</span>

            {ds === "blocked" ? (
              <BtnSuccess onClick={() => setPendingAction({ title: "Desbloquear usuário?", message: `O acesso de ${firstName} será reativado.`, confirmLabel: "Desbloquear", variant: "green", execute: apiToggle })}>
                <Unlock className="h-3 w-3" /> Desbloquear
              </BtnSuccess>
            ) : (
              <BtnDanger onClick={() => setPendingAction({ title: "Bloquear acesso do usuário?", message: `${firstName} não conseguirá fazer login enquanto estiver bloqueado.`, confirmLabel: "Bloquear acesso", variant: "red", execute: apiToggle })}>
                <Lock className="h-3 w-3" /> Bloquear
              </BtnDanger>
            )}

            <span className="text-border text-xs select-none">|</span>

            <Btn onClick={() => openInline("email")} title="Alterar e-mail de acesso"><Mail className="h-3 w-3" /> Alt. Email</Btn>
            <Btn onClick={() => openInline("password")} title="Alterar senha de acesso"><KeyRound className="h-3 w-3" /> Alt. Senha</Btn>
            <Btn title="Copiar credenciais de acesso" onClick={() => {
              if (!member.password) { flash("Sem senha configurada — defina uma senha primeiro."); return; }
              setPendingAction({ title: "Reenviar dados de acesso?", message: `As credenciais de ${firstName} serão copiadas para a área de transferência.`, confirmLabel: "Copiar credenciais", variant: "neutral",
                execute: async () => {
                  await navigator.clipboard.writeText(`Acesso ao sistema:\nLogin: ${member.email}\nSenha: (definida no cadastro)`);
                  flash("Credenciais copiadas para a área de transferência");
                },
              });
            }}><Copy className="h-3 w-3" /> Reenviar</Btn>
          </div>

          {inlineMode === "email" && (
            <div className="flex items-center gap-2 pt-1">
              <Mail className="h-4 w-4 text-text-muted shrink-0" />
              <input autoFocus type="email" value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") requestSaveInline(); if (e.key === "Escape") closeInline(); }}
                placeholder="Novo e-mail..." className={`${INPUT} flex-1`} />
              <button type="button" onClick={requestSaveInline} disabled={inlineLoad}
                className="h-8 px-3 text-xs rounded border border-green/30 text-green hover:bg-green/10 transition-colors disabled:opacity-50">
                {inlineLoad ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Salvar"}
              </button>
              <button type="button" onClick={closeInline} className="text-text-muted hover:text-text p-1"><X className="h-4 w-4" /></button>
              {inlineErr && <p className="text-xs text-red">{inlineErr}</p>}
            </div>
          )}

          {inlineMode === "password" && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-text-muted shrink-0" />
                <div className="relative flex-1">
                  <input autoFocus type={showPwd ? "text" : "password"} autoComplete="new-password"
                    value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") closeInline(); }}
                    placeholder="Nova senha..." className={`${INPUT} pr-8`} />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button type="button" onClick={() => { const p = generatePassword(); setInlineVal(p); setInlineConf(p); setShowPwd(true); }}
                  className="h-8 px-2.5 text-xs rounded border border-border text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap">Gerar</button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 shrink-0" />
                <input type={showPwd ? "text" : "password"} autoComplete="new-password"
                  value={inlineConf} onChange={e => setInlineConf(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") requestSaveInline(); if (e.key === "Escape") closeInline(); }}
                  placeholder="Confirmar senha..." className={`${INPUT} flex-1`} />
                <button type="button" onClick={requestSaveInline} disabled={inlineLoad}
                  className="h-8 px-3 text-xs rounded border border-green/30 text-green hover:bg-green/10 transition-colors disabled:opacity-50 whitespace-nowrap">
                  {inlineLoad ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Salvar"}
                </button>
                <button type="button" onClick={closeInline} className="text-text-muted hover:text-text p-1"><X className="h-4 w-4" /></button>
              </div>
              {inlineErr && <p className="text-xs text-red pl-6">{inlineErr}</p>}
            </div>
          )}
        </div>
      </div>

      {pendingAction && <ConfirmModal action={pendingAction} onClose={() => setPendingAction(null)} />}
    </>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(members: MemberWithRequest[]) {
  const header = [
    "Nome", "E-mail", "Telefone", "Perfil", "Status acesso",
    "Data entrada", "Expira em", "Tipo acesso",
    "Status calendário", "Data entrega", "Origem", "Observações",
  ];
  const rows = members.map(m => [
    m.name,
    m.email,
    m.phone ?? "",
    PROFILE_LABELS[m.profile ?? "user"],
    SC[getDisplayStatus(m)].label,
    formatDateBR(m.entry_date),
    m.expires_at ? formatDateBR(m.expires_at) : "",
    ACCESS_LABELS[m.access_type ?? "30d"],
    CSC[getCalendarStatus(m)].label,
    m.cal_published_at ? formatDateBR(m.cal_published_at) : "",
    m.origin ?? "",
    m.notes ?? "",
  ]);
  const csv = [header, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `usuarios-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── New member modal ─────────────────────────────────────────────────────────

function NewMemberModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (m: MemberWithRequest) => void;
}) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [pwdConf, setPwdConf]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [profile, setProfile]   = useState<MemberProfile>("user");
  const [accessType, setAccessType] = useState<MemberAccessType>("30d");
  const [origin, setOrigin]     = useState("Manual");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const DAYS_MAP: Record<MemberAccessType, number | null> = { "30d": 30, "90d": 90, "365d": 365, "lifetime": null };

  async function handleSave() {
    if (!name.trim())  { setError("Nome é obrigatório"); return; }
    if (!email.trim()) { setError("E-mail é obrigatório"); return; }
    if (password && password !== pwdConf) { setError("As senhas não coincidem"); return; }
    setSaving(true); setError(null);
    const days = DAYS_MAP[accessType];
    const today = new Date().toISOString().split("T")[0];
    const expiresAt = days !== null
      ? (() => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; })()
      : null;
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || null,
          password: password.trim() || null, profile, access_type: accessType, expires_at: expiresAt,
          origin: origin || null, notes: notes.trim() || null, entry_date: today }),
      });
      const data = await res.json<{ member?: MemberWithRequest; error?: string }>();
      if (!res.ok) { setError(data.error ?? "Erro ao criar usuário"); return; }
      onCreated(data.member!);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text">Novo usuário</h2>
            <p className="text-xs text-text-muted mt-0.5">Cadastrar aluno ou produtor</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nome *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className={INPUT_LG} autoFocus />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">E-mail *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className={INPUT_LG} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Telefone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={INPUT_LG} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Perfil</label>
              <select value={profile} onChange={e => setProfile(e.target.value as MemberProfile)} className={SELECT}>
                <option value="user">Usuário</option>
                <option value="support">Suporte</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Senha de acesso</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={showPwd ? "text" : "password"} autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)} placeholder="Definir senha..." className={`${INPUT_LG} pr-9`} />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => { const p = generatePassword(); setPassword(p); setPwdConf(p); setShowPwd(true); }}
                  className="h-9 px-3 rounded-md border border-border text-sm text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap">Gerar senha</button>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Confirmar senha</label>
              <input type={showPwd ? "text" : "password"} autoComplete="new-password"
                value={pwdConf} onChange={e => setPwdConf(e.target.value)} placeholder="Repita a senha..." className={INPUT_LG} />
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Observação interna</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas internas..." className={TEXTAREA} />
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-sm px-4 h-9 rounded-md border border-border hover:bg-text/5 transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="text-sm px-5 h-9 rounded-md bg-text text-bg hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New migration member modal ───────────────────────────────────────────────

function NewMigrationMemberModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (m: MemberWithRequest) => void;
}) {
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [pwdConf,   setPwdConf]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [accessType, setAccessType] = useState<MemberAccessType>("lifetime");
  const [farmName,  setFarmName]  = useState("");
  const [state,     setState]     = useState("");
  const [city,      setCity]      = useState("");
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim())     { setError("Nome é obrigatório"); return; }
    if (!email.trim())    { setError("E-mail é obrigatório"); return; }
    if (!farmName.trim()) { setError("Nome da fazenda é obrigatório"); return; }
    if (!state.trim() || state.trim().length > 2) { setError("UF deve ter 2 letras"); return; }
    if (!city.trim())     { setError("Cidade é obrigatória"); return; }
    if (!password.trim()) { setError("Senha é obrigatória"); return; }
    if (password !== pwdConf) { setError("As senhas não coincidem"); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/admin/members/migration", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone: phone.trim() || null,
          password: password.trim(), access_type: accessType,
          farm_name: farmName.trim(), state: state.trim().toUpperCase(), city: city.trim(),
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json<{ member?: MemberWithRequest; error?: string }>();
      if (!res.ok) { setError(data.error ?? "Erro ao criar usuário"); return; }
      onCreated(data.member!);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-400" />
              <h2 className="text-base font-semibold text-text">Novo usuário de migração</h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Criação manual — calendário existente (PDF)</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* User data */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted font-medium mb-3">Dados do usuário</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nome completo *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do produtor" className={INPUT_LG} autoFocus />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">E-mail *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className={INPUT_LG} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Telefone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={INPUT_LG} />
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
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Senha de acesso *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPwd ? "text" : "password"} autoComplete="new-password"
                      value={password} onChange={e => setPassword(e.target.value)} placeholder="Definir senha..." className={`${INPUT_LG} pr-9`} />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button type="button" onClick={() => { const p = generatePassword(); setPassword(p); setPwdConf(p); setShowPwd(true); }}
                    className="h-9 px-3 rounded-md border border-border text-sm text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap">Gerar senha</button>
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Confirmar senha *</label>
                <input type={showPwd ? "text" : "password"} autoComplete="new-password"
                  value={pwdConf} onChange={e => setPwdConf(e.target.value)} placeholder="Repita a senha..." className={INPUT_LG} />
              </div>
            </div>
          </div>

          {/* Farm data */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted font-medium mb-3">Dados da propriedade</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nome da fazenda *</label>
                <input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="Nome da fazenda" className={INPUT_LG} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">UF *</label>
                <input value={state} onChange={e => setState(e.target.value.toUpperCase())} placeholder="MG" maxLength={2} className={INPUT_LG} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Cidade *</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Nome da cidade" className={INPUT_LG} />
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Observação interna</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Localização do PDF, histórico do aluno, instruções..." className={TEXTAREA} />
          </div>

          {error && <p className="text-sm text-red bg-red/10 border border-red/20 rounded-md px-3 py-2">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-sm px-4 h-9 rounded-md border border-border hover:bg-text/5 transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm px-5 h-9 rounded-md bg-blue-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Criando…</> : <><ArrowRightLeft className="h-3.5 w-3.5" /> Criar usuário de migração</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterKey    = "all" | DisplayStatus | "inactive";
type CalFilterKey = "all" | CalendarStatusKey;

const STORAGE_KEY = "vpc_member_filters";

interface SavedFilters {
  search?: string;
  filter?: string;
  calFilter?: string;
  profileFilter?: string;
  accessTypeFilter?: string;
  originFilter?: string;
  entryFrom?: string;
  entryTo?: string;
  expiryFrom?: string;
  expiryTo?: string;
  pageSize?: number;
}

export function MembersList({ members: initial, requests }: { members: MemberWithRequest[]; requests: AdminRequestRow[] }) {
  const [members, setMembers]           = useState<MemberWithRequest[]>(initial);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState<FilterKey>("all");
  const [calFilter, setCalFilter]       = useState<CalFilterKey>("all");
  const [profileFilter, setProfileFilter]       = useState("all");
  const [accessTypeFilter, setAccessTypeFilter] = useState("all");
  const [originFilter, setOriginFilter]         = useState("all");
  const [entryFrom, setEntryFrom]       = useState("");
  const [entryTo, setEntryTo]           = useState("");
  const [expiryFrom, setExpiryFrom]     = useState("");
  const [expiryTo, setExpiryTo]         = useState("");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);
  const [showModal, setShowModal]             = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showExport, setShowExport]           = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filtersLoaded, setFiltersLoaded]     = useState(false);

  // Load persisted filters on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const f: SavedFilters = JSON.parse(raw);
        if (f.search !== undefined)           setSearch(f.search);
        if (f.filter !== undefined)           setFilter(f.filter as FilterKey);
        if (f.calFilter !== undefined)        setCalFilter(f.calFilter as CalFilterKey);
        if (f.profileFilter !== undefined)    setProfileFilter(f.profileFilter);
        if (f.accessTypeFilter !== undefined) setAccessTypeFilter(f.accessTypeFilter);
        if (f.originFilter !== undefined)     setOriginFilter(f.originFilter);
        if (f.entryFrom !== undefined)        setEntryFrom(f.entryFrom);
        if (f.entryTo !== undefined)          setEntryTo(f.entryTo);
        if (f.expiryFrom !== undefined)       setExpiryFrom(f.expiryFrom);
        if (f.expiryTo !== undefined)         setExpiryTo(f.expiryTo);
        if (f.pageSize !== undefined)         setPageSize(f.pageSize);
      }
    } catch { /* ignore localStorage errors */ }
    setFiltersLoaded(true);
  }, []);

  // Persist filters whenever they change (only after initial load)
  useEffect(() => {
    if (!filtersLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        search, filter, calFilter, profileFilter, accessTypeFilter,
        originFilter, entryFrom, entryTo, expiryFrom, expiryTo, pageSize,
      } satisfies SavedFilters));
    } catch { /* ignore */ }
  }, [filtersLoaded, search, filter, calFilter, profileFilter, accessTypeFilter, originFilter, entryFrom, entryTo, expiryFrom, expiryTo, pageSize]);

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setPage(1);
  }, [search, filter, calFilter, profileFilter, accessTypeFilter, originFilter, entryFrom, entryTo, expiryFrom, expiryTo]);

  const withStatus = useMemo(
    () => members.map(m => ({ m, ds: getDisplayStatus(m), cs: getCalendarStatus(m) })),
    [members],
  );

  const stats = useMemo(() => ({
    total:    members.length,
    active:   withStatus.filter(x => x.ds === "active").length,
    expiring: withStatus.filter(x => x.ds === "expiring").length,
    blocked:  members.filter(m => m.status === "blocked").length,
    lifetime: withStatus.filter(x => x.ds === "lifetime").length,
    inactive: members.filter(m => (m.status as string) === "inactive").length,
  }), [members, withStatus]);

  // Count active filters (excluding search — shown separately)
  const activeFilterCount = useMemo(() => [
    filter !== "all",
    calFilter !== "all",
    profileFilter !== "all",
    accessTypeFilter !== "all",
    originFilter !== "all",
    !!entryFrom,
    !!entryTo,
    !!expiryFrom,
    !!expiryTo,
  ].filter(Boolean).length, [filter, calFilter, profileFilter, accessTypeFilter, originFilter, entryFrom, entryTo, expiryFrom, expiryTo]);

  const hasActiveFilters = activeFilterCount > 0 || search.trim().length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withStatus
      .filter(({ m, ds, cs }) => {

        // ── Status tab ──────────────────────────────────────────────────────
        if (filter === "inactive") {
          if ((m.status as string) !== "inactive") return false;
        } else if (filter !== "all" && ds !== filter) {
          return false;
        }

        // ── Calendar status ─────────────────────────────────────────────────
        if (calFilter !== "all" && cs !== calFilter) return false;

        // ── Perfil ──────────────────────────────────────────────────────────
        if (profileFilter !== "all") {
          if (profileFilter === "produtor") {
            // Produtor = profile user WITH a registered farm
            if (m.profile !== "user" || !m.farm_name) return false;
          } else if (profileFilter === "usuario") {
            // Usuário = profile user WITHOUT a farm (pure account)
            if (m.profile !== "user" || !!m.farm_name) return false;
          } else {
            if (m.profile !== profileFilter) return false;
          }
        }

        // ── Tipo de acesso ──────────────────────────────────────────────────
        if (accessTypeFilter !== "all" && m.access_type !== accessTypeFilter) return false;

        // ── Origem ──────────────────────────────────────────────────────────
        if (originFilter !== "all") {
          const memberOrigin = m.origin?.trim() || "Manual";
          if (memberOrigin !== originFilter) return false;
        }

        // ── Data de entrada (compra) ────────────────────────────────────────
        if (entryFrom && (!m.entry_date || m.entry_date < entryFrom)) return false;
        if (entryTo   && (!m.entry_date || m.entry_date > entryTo))   return false;

        // ── Data de expiração ───────────────────────────────────────────────
        if (expiryFrom && (!m.expires_at || m.expires_at < expiryFrom)) return false;
        if (expiryTo   && (!m.expires_at || m.expires_at > expiryTo))   return false;

        // ── Busca textual ───────────────────────────────────────────────────
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          (m.phone ?? "").toLowerCase().includes(q)
        );
      })
      .map(({ m }) => m);
  }, [withStatus, search, filter, calFilter, profileFilter, accessTypeFilter, originFilter, entryFrom, entryTo, expiryFrom, expiryTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  function clearAllFilters() {
    setSearch("");
    setFilter("all");
    setCalFilter("all");
    setProfileFilter("all");
    setAccessTypeFilter("all");
    setOriginFilter("all");
    setEntryFrom("");
    setEntryTo("");
    setExpiryFrom("");
    setExpiryTo("");
  }

  function onUpdate(updated: Member) {
    setMembers(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } as MemberWithRequest : m));
  }

  function onCreated(m: MemberWithRequest) {
    setMembers(prev => [m, ...prev]);
    setShowModal(false);
  }

  const memberTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",      label: "Todos",      count: stats.total },
    { key: "active",   label: "Ativos",     count: stats.active },
    { key: "expiring", label: "Expirando",  count: stats.expiring },
    { key: "blocked",  label: "Bloqueados", count: stats.blocked },
    { key: "lifetime", label: "Vitalícios", count: stats.lifetime },
    { key: "inactive", label: "Inativos",   count: stats.inactive },
  ];

  const SELECT_ACTIVE = `${SELECT} border-text/50 text-text`;

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
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full h-9 rounded-md border border-border bg-bg pl-9 pr-8 text-sm focus:outline-none focus:border-text-muted transition-colors"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtros button */}
        <button
          type="button"
          onClick={() => setShowFilterPanel(p => !p)}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors whitespace-nowrap ${
            activeFilterCount > 0
              ? "border-text/40 text-text bg-text/10 font-medium"
              : "border-border text-text-muted hover:bg-text/5 hover:text-text"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center bg-text text-bg text-[10px] font-bold rounded-full w-4 h-4 leading-none tabular-nums">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilterPanel ? "rotate-180" : ""}`} />
        </button>

        {/* Limpar filtros (visible when any filter is active) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" /> Limpar filtros
          </button>
        )}

        {/* Export dropdown */}
        <div className="relative">
          <button type="button" onClick={() => setShowExport(p => !p)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-text-muted hover:bg-text/5 transition-colors">
            <Download className="h-4 w-4" /> Exportar <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[180px]">
                <button type="button" onClick={() => { exportCSV(filtered); setShowExport(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:bg-text/5 transition-colors text-left">
                  <Download className="h-4 w-4" /> Exportar CSV
                  {hasActiveFilters && <span className="ml-auto text-[10px] text-text-muted/60">({filtered.length})</span>}
                </button>
                <button type="button" onClick={() => { window.print(); setShowExport(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:bg-text/5 transition-colors text-left">
                  <Printer className="h-4 w-4" /> Imprimir / PDF
                </button>
              </div>
            </>
          )}
        </div>

        <button type="button" onClick={() => setShowMigrationModal(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors shrink-0">
          <ArrowRightLeft className="h-4 w-4" /> Migração manual
        </button>
        <button type="button" onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-text text-bg text-sm hover:opacity-90 transition-opacity shrink-0">
          <Plus className="h-4 w-4" /> Novo usuário
        </button>
      </div>

      {/* Advanced filter panel */}
      {showFilterPanel && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Perfil */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Perfil</label>
              <select
                value={profileFilter}
                onChange={e => setProfileFilter(e.target.value)}
                className={profileFilter !== "all" ? SELECT_ACTIVE : SELECT}
              >
                <option value="all">Todos os perfis</option>
                <option value="usuario">Usuário</option>
                <option value="produtor">Produtor</option>
                <option value="support">Suporte</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Tipo de acesso */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Tipo de acesso</label>
              <select
                value={accessTypeFilter}
                onChange={e => setAccessTypeFilter(e.target.value)}
                className={accessTypeFilter !== "all" ? SELECT_ACTIVE : SELECT}
              >
                <option value="all">Todos os tipos</option>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
                <option value="365d">365 dias</option>
                <option value="lifetime">Vitalício</option>
              </select>
            </div>

            {/* Origem */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Origem</label>
              <select
                value={originFilter}
                onChange={e => setOriginFilter(e.target.value)}
                className={originFilter !== "all" ? SELECT_ACTIVE : SELECT}
              >
                <option value="all">Todas as origens</option>
                <option value="Manual">Manual</option>
                <option value="Hotmart">Hotmart</option>
                <option value="Kiwify">Kiwify</option>
                <option value="PerfectPay">PerfectPay</option>
                <option value="Eduzz">Eduzz</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Status do calendário */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Status do calendário</label>
              <select
                value={calFilter}
                onChange={e => setCalFilter(e.target.value as CalFilterKey)}
                className={calFilter !== "all" ? SELECT_ACTIVE : SELECT}
              >
                <option value="all">Todos</option>
                <option value="not_started">{CSC.not_started.label}</option>
                <option value="awaiting_form">{CSC.awaiting_form.label}</option>
                <option value="requested">{CSC.requested.label}</option>
                <option value="in_production">{CSC.in_production.label}</option>
                <option value="published">{CSC.published.label}</option>
                <option value="delivered">{CSC.delivered.label}</option>
              </select>
            </div>

            {/* Compra de */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Compra de</label>
              <input
                type="date"
                value={entryFrom}
                onChange={e => setEntryFrom(e.target.value)}
                className={entryFrom ? SELECT_ACTIVE : SELECT}
              />
            </div>

            {/* Compra até */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Compra até</label>
              <input
                type="date"
                value={entryTo}
                onChange={e => setEntryTo(e.target.value)}
                className={entryTo ? SELECT_ACTIVE : SELECT}
              />
            </div>

            {/* Expiração de */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Expiração de</label>
              <input
                type="date"
                value={expiryFrom}
                onChange={e => setExpiryFrom(e.target.value)}
                className={expiryFrom ? SELECT_ACTIVE : SELECT}
              />
            </div>

            {/* Expiração até */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Expiração até</label>
              <input
                type="date"
                value={expiryTo}
                onChange={e => setExpiryTo(e.target.value)}
                className={expiryTo ? SELECT_ACTIVE : SELECT}
              />
            </div>

          </div>

          {/* Panel footer: result count + clear */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs text-text-muted">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {hasActiveFilters && ` de ${members.length}`}
            </span>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors">
                <X className="h-3 w-3" /> Limpar {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Member status filter tabs */}
      <div className="flex border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {memberTabs.map(({ key, label, count }) => (
          <button key={key} type="button" onClick={() => setFilter(key)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              filter === key ? "border-text text-text font-medium" : "border-transparent text-text-muted hover:text-text"
            }`}>
            {label}
            <span className="ml-1.5 text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {hasActiveFilters
              ? "Nenhum usuário encontrado com os filtros aplicados."
              : "Nenhum usuário cadastrado ainda."}
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={clearAllFilters}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text border border-border rounded-md px-4 h-9 transition-colors">
              <X className="h-4 w-4" /> Limpar filtros
            </button>
          ) : (
            <button type="button" onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text border border-border rounded-md px-4 h-9 transition-colors">
              <Plus className="h-4 w-4" /> Cadastrar primeiro usuário
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map(m => <MemberCard key={m.id} member={m} onUpdate={onUpdate} />)}
          </div>

          {/* Pagination footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">

            {/* Per-page selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Exibir:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="h-8 rounded border border-border bg-bg px-2 pr-6 text-xs text-text-muted focus:outline-none focus:border-text-muted transition-colors appearance-none cursor-pointer"
                style={{ backgroundImage: "none" }}
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
              <span className="text-xs text-text-muted/60 tabular-nums">
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} de {filtered.length}
              </span>
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex items-center justify-center w-8 h-8 rounded border border-border text-text-muted hover:bg-text/5 hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-text-muted tabular-nums px-2 min-w-[4rem] text-center">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center justify-center w-8 h-8 rounded border border-border text-text-muted hover:bg-text/5 hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </>
      )}

      {showModal          && <NewMemberModal          onClose={() => setShowModal(false)}          onCreated={onCreated} />}
      {showMigrationModal && <NewMigrationMemberModal onClose={() => setShowMigrationModal(false)} onCreated={onCreated} />}
    </div>
  );
}
