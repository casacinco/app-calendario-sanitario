"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, Package, ShoppingBag, CalendarDays,
  Infinity as InfinityIcon, Lock, Unlock, RefreshCw,
  ExternalLink, Users, X, Clock, Mail, KeyRound,
  Eye, EyeOff, Copy, Check, Wifi, MonitorSmartphone,
} from "lucide-react";
import type {
  MemberWithRequest, Member, AdminRequestRow,
  MemberProfile, MemberAccessType,
} from "@/lib/db";
import { formatDateBR } from "@/lib/format";

// ─── Display status ───────────────────────────────────────────────────────────

type DisplayStatus = "active" | "expiring" | "blocked" | "lifetime" | "support" | "admin";
type InlineMode    = "email" | "password" | null;

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

function generatePassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

// ─── Status config ────────────────────────────────────────────────────────────

const SC: Record<DisplayStatus, { label: string; badge: string; bar: string; avatar: string }> = {
  active:   { label: "Ativo",     badge: "bg-green/15 text-green border-green/30",                  bar: "bg-green",      avatar: "bg-green/20 text-green" },
  expiring: { label: "Expirando", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",   bar: "bg-yellow-500", avatar: "bg-yellow-500/20 text-yellow-400" },
  blocked:  { label: "Bloqueado", badge: "bg-red/15 text-red border-red/30",                        bar: "bg-red",        avatar: "bg-red/20 text-red" },
  lifetime: { label: "Vitalício", badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",         bar: "bg-blue-500",   avatar: "bg-blue-500/20 text-blue-400" },
  support:  { label: "Suporte",   badge: "bg-purple-500/15 text-purple-400 border-purple-500/25",   bar: "bg-purple-500", avatar: "bg-purple-500/20 text-purple-400" },
  admin:    { label: "Admin",     badge: "bg-text/10 text-text-muted border-border",                bar: "bg-text-muted", avatar: "bg-text/10 text-text-muted" },
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

// ─── Action button ────────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, loading, danger, success, title, children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  success?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 whitespace-nowrap
        ${danger  ? "border-red/30 text-red hover:bg-red/10" :
          success ? "border-green/30 text-green hover:bg-green/10" :
          "border-border text-text-muted hover:bg-text/5 hover:text-text"}`}
    >
      {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : children}
    </button>
  );
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const INPUT    = "h-8 w-full rounded border border-border bg-bg px-2.5 text-sm focus:outline-none focus:border-text-muted transition-colors";
const INPUT_LG = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT   = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const TEXTAREA = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors resize-none";

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({ member, onUpdate }: { member: MemberWithRequest; onUpdate: (u: Member) => void }) {
  const [loading, setLoading]         = useState<string | null>(null);
  const [err, setErr]                 = useState<string | null>(null);
  const [feedback, setFeedback]       = useState<string | null>(null);
  const [inlineMode, setInlineMode]   = useState<InlineMode>(null);
  const [inlineVal, setInlineVal]     = useState("");
  const [inlineConf, setInlineConf]   = useState("");
  const [inlineErr, setInlineErr]     = useState<string | null>(null);
  const [inlineLoad, setInlineLoad]   = useState(false);
  const [showPwd, setShowPwd]         = useState(false);

  const ds       = getDisplayStatus(member);
  const daysLeft = getDaysLeft(member.expires_at);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  function openInline(mode: InlineMode) {
    setInlineMode(mode);
    setInlineVal(mode === "email" ? member.email : "");
    setInlineConf("");
    setInlineErr(null);
  }

  function closeInline() {
    setInlineMode(null);
    setInlineVal("");
    setInlineConf("");
    setInlineErr(null);
  }

  // ── API calls ──────────────────────────────────────────────────────────────

  async function apiPost(action: string, url: string, body?: object) {
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
    } catch { setErr("Erro de conexão"); }
    finally  { setLoading(null); }
  }

  async function saveInline() {
    if (inlineMode === "email") {
      if (!inlineVal.trim()) { setInlineErr("E-mail é obrigatório"); return; }
    } else {
      if (!inlineVal.trim()) { setInlineErr("Senha é obrigatória"); return; }
      if (inlineVal !== inlineConf) { setInlineErr("As senhas não coincidem"); return; }
    }
    setInlineLoad(true);
    setInlineErr(null);
    try {
      const body = inlineMode === "email" ? { email: inlineVal.trim() } : { password: inlineVal };
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json<{ member?: Member; error?: string }>();
      if (!res.ok) { setInlineErr(data.error ?? "Erro"); return; }
      onUpdate(data.member!);
      closeInline();
      flash(inlineMode === "email" ? "E-mail atualizado" : "Senha atualizada");
    } catch { setInlineErr("Erro de conexão"); }
    finally  { setInlineLoad(false); }
  }

  function handleResend() {
    if (!member.password) { flash("Sem senha configurada — defina uma senha primeiro."); return; }
    const text = `Acesso ao sistema:\nLogin: ${member.email}\nSenha: ${member.password}`;
    navigator.clipboard.writeText(text)
      .then(() => flash("Credenciais copiadas para a área de transferência"))
      .catch(() => flash(`Senha: ${member.password}`));
  }

  // ── Subscription status label ──────────────────────────────────────────────

  function subscriptionLabel(): string {
    if (member.access_type === "lifetime") return "Vitalício";
    if (member.status === "blocked")       return "Bloqueado";
    if (!member.expires_at)                return "—";
    const d = getDaysLeft(member.expires_at);
    if (d !== null && d <= 0)  return "Expirado";
    if (d !== null && d <= 30) return "Expirando";
    return "Ativo";
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Status bar */}
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

        {/* Icon shortcuts */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Copiar e-mail"
            onClick={() => navigator.clipboard.writeText(member.email).then(() => flash("E-mail copiado"))}
            className="p-1.5 rounded text-text-muted hover:text-text hover:bg-text/5 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <Link
            href={`/admin/usuarios/${member.id}`}
            title="Abrir página de edição"
            className="p-1.5 rounded text-text-muted hover:text-text hover:bg-text/5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Info grid ────────────────────────────────────────────────────── */}
      <div className="px-5 pb-4 border-t border-border pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          <InfoCell label="Produto"        value={member.product} />
          <InfoCell label="Último acesso"  value={member.last_access ? formatDateBR(member.last_access) : null} />
          <InfoCell label="Origem"         value={member.origin} />
          <InfoCell label="Perfil"         value={PROFILE_LABELS[member.profile ?? "user"]} />
          <InfoCell label="Data de entrada" value={formatDateBR(member.entry_date)} />
          <InfoCell label="Tipo de acesso" value={ACCESS_LABELS[member.access_type ?? "30d"]} />
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
              daysLeft !== null && daysLeft <= 30 ? "text-yellow-400" :
              "text-text-muted"
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
              }`}>
                {subscriptionLabel()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>Sem data de expiração configurada</span>
            </div>
          )}
        </div>

        {/* ── Device info ───────────────────────────────────────────────── */}
        {member.device_info && (
          <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
            <MonitorSmartphone className="h-3.5 w-3.5 shrink-0" />
            <span>{member.device_info}</span>
          </div>
        )}

        {/* ── Calendar link ──────────────────────────────────────────────── */}
        {(member.calendar_id || member.calendar_request_id) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {member.calendar_id ? (
              <Link href={`/admin/calendarios/${member.calendar_id}`} className="hover:text-text underline underline-offset-2">
                Ver calendário vinculado ↗
              </Link>
            ) : (
              <Link href={`/admin/requests/${member.calendar_request_id}`} className="hover:text-text underline underline-offset-2">
                Ver solicitação vinculada ↗
              </Link>
            )}
          </div>
        )}

        {/* ── Feedback toast ─────────────────────────────────────────────── */}
        {feedback && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green">
            <Check className="h-3.5 w-3.5" /> {feedback}
          </div>
        )}
        {err && <p className="mt-2 text-xs text-red">{err}</p>}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-border bg-bg/30 space-y-2">

        {/* Main actions row */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Extend time */}
          <Btn onClick={() => apiPost("+30d",    `/api/admin/members/${member.id}/extend`, { days: 30  })} loading={loading === "+30d"}    disabled={!!loading}>+30d</Btn>
          <Btn onClick={() => apiPost("+90d",    `/api/admin/members/${member.id}/extend`, { days: 90  })} loading={loading === "+90d"}    disabled={!!loading}>+90d</Btn>
          <Btn onClick={() => apiPost("+365d",   `/api/admin/members/${member.id}/extend`, { days: 365 })} loading={loading === "+365d"}   disabled={!!loading}>+365d</Btn>
          <Btn onClick={() => apiPost("lifetime",`/api/admin/members/${member.id}/extend`, { type: "lifetime" })} loading={loading === "lifetime"} disabled={!!loading || ds === "lifetime"}>
            <InfinityIcon className="h-3 w-3" /> Vitalício
          </Btn>

          <span className="text-border text-xs select-none">|</span>

          {/* Block/Unblock */}
          <Btn
            onClick={() => apiPost("toggle", `/api/admin/members/${member.id}/toggle`)}
            loading={loading === "toggle"}
            disabled={!!loading}
            danger={ds !== "blocked"}
            success={ds === "blocked"}
          >
            {ds === "blocked"
              ? <><Unlock className="h-3 w-3" /> Desbloquear</>
              : <><Lock   className="h-3 w-3" /> Bloquear</>}
          </Btn>

          <span className="text-border text-xs select-none">|</span>

          {/* Account actions */}
          <Btn onClick={() => openInline("email")}    disabled={!!loading} title="Alterar e-mail de acesso">
            <Mail className="h-3 w-3" /> Alt. Email
          </Btn>
          <Btn onClick={() => openInline("password")} disabled={!!loading} title="Alterar senha de acesso">
            <KeyRound className="h-3 w-3" /> Alt. Senha
          </Btn>
          <Btn onClick={handleResend} disabled={!!loading} title="Copiar credenciais de acesso">
            <Copy className="h-3 w-3" /> Reenviar
          </Btn>
        </div>

        {/* Inline: edit email */}
        {inlineMode === "email" && (
          <div className="flex items-center gap-2 pt-1">
            <Mail className="h-4 w-4 text-text-muted shrink-0" />
            <input
              autoFocus
              type="email"
              value={inlineVal}
              onChange={e => setInlineVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveInline(); if (e.key === "Escape") closeInline(); }}
              placeholder="Novo e-mail..."
              className={`${INPUT} flex-1`}
            />
            <button
              type="button"
              onClick={saveInline}
              disabled={inlineLoad}
              className="h-8 px-3 text-xs rounded border border-green/30 text-green hover:bg-green/10 transition-colors disabled:opacity-50"
            >
              {inlineLoad ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Salvar"}
            </button>
            <button type="button" onClick={closeInline} className="text-text-muted hover:text-text p-1">
              <X className="h-4 w-4" />
            </button>
            {inlineErr && <p className="text-xs text-red">{inlineErr}</p>}
          </div>
        )}

        {/* Inline: change password */}
        {inlineMode === "password" && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-text-muted shrink-0" />
              <div className="relative flex-1">
                <input
                  autoFocus
                  type={showPwd ? "text" : "password"}
                  value={inlineVal}
                  onChange={e => setInlineVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") closeInline(); }}
                  placeholder="Nova senha..."
                  className={`${INPUT} pr-8`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { const p = generatePassword(); setInlineVal(p); setInlineConf(p); setShowPwd(true); }}
                className="h-8 px-2.5 text-xs rounded border border-border text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap"
              >
                Gerar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 shrink-0" />
              <input
                type={showPwd ? "text" : "password"}
                value={inlineConf}
                onChange={e => setInlineConf(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveInline(); if (e.key === "Escape") closeInline(); }}
                placeholder="Confirmar senha..."
                className={`${INPUT} flex-1`}
              />
              <button
                type="button"
                onClick={saveInline}
                disabled={inlineLoad}
                className="h-8 px-3 text-xs rounded border border-green/30 text-green hover:bg-green/10 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {inlineLoad ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Salvar"}
              </button>
              <button type="button" onClick={closeInline} className="text-text-muted hover:text-text p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            {inlineErr && <p className="text-xs text-red pl-6">{inlineErr}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New member modal ─────────────────────────────────────────────────────────

function NewMemberModal({
  onClose, onCreated,
}: {
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

  const DAYS_MAP: Record<MemberAccessType, number | null> = {
    "30d": 30, "90d": 90, "365d": 365, "lifetime": null,
  };

  async function handleSave() {
    if (!name.trim())  { setError("Nome é obrigatório"); return; }
    if (!email.trim()) { setError("E-mail é obrigatório"); return; }
    if (password && password !== pwdConf) { setError("As senhas não coincidem"); return; }
    setSaving(true);
    setError(null);

    const days = DAYS_MAP[accessType];
    const today = new Date().toISOString().split("T")[0];
    const expiresAt = days !== null
      ? (() => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; })()
      : null;

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone: phone.trim() || null,
          password: password.trim() || null,
          profile, access_type: accessType, expires_at: expiresAt,
          origin: origin || null,
          notes: notes.trim() || null,
          entry_date: today,
        }),
      });
      const data = await res.json<{ member?: MemberWithRequest; error?: string }>();
      if (!res.ok) { setError(data.error ?? "Erro ao criar usuário"); return; }
      onCreated(data.member!);
    } finally { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text">Novo usuário</h2>
            <p className="text-xs text-text-muted mt-0.5">Cadastrar aluno ou produtor</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
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

            {/* Password */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Senha de acesso</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Definir senha..."
                    className={`${INPUT_LG} pr-9`}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { const p = generatePassword(); setPassword(p); setPwdConf(p); setShowPwd(true); }}
                  className="h-9 px-3 rounded-md border border-border text-sm text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap"
                >
                  Gerar senha
                </button>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Confirmar senha</label>
              <input
                type={showPwd ? "text" : "password"}
                value={pwdConf}
                onChange={e => setPwdConf(e.target.value)}
                placeholder="Repita a senha..."
                className={INPUT_LG}
              />
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

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Observação interna</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas internas..." className={TEXTAREA} />
          </div>

          {error && <p className="text-sm text-red">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-sm px-4 h-9 rounded-md border border-border hover:bg-text/5 transition-colors">Cancelar</button>
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

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterKey = "all" | DisplayStatus;

export function MembersList({ members: initial, requests }: { members: MemberWithRequest[]; requests: AdminRequestRow[] }) {
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
    setMembers(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } as MemberWithRequest : m));
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
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              filter === key ? "border-text text-text font-medium" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
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
            {search || filter !== "all" ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado ainda."}
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
        <div className="space-y-4">
          {filtered.map(m => <MemberCard key={m.id} member={m} onUpdate={onUpdate} />)}
        </div>
      )}

      {showModal && <NewMemberModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
    </div>
  );
}
