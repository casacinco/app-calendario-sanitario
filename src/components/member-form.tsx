"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Lock, Unlock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { MemberWithRequest, MemberProfile, MemberAccessType } from "@/lib/db";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</label>
      {children}
    </div>
  );
}

const INPUT    = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT   = "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const TEXTAREA = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors resize-none";

export function MemberForm({ member }: { member: MemberWithRequest }) {
  const router = useRouter();

  const [name, setName]               = useState(member.name);
  const [email, setEmail]             = useState(member.email);
  const [phone, setPhone]             = useState(member.phone ?? "");
  const [product, setProduct]         = useState(member.product ?? "");
  const [origin, setOrigin]           = useState(member.origin ?? "");
  const [notes, setNotes]             = useState(member.notes ?? "");
  const [profile, setProfile]         = useState<MemberProfile>(member.profile ?? "user");
  const [accessType, setAccessType]   = useState<MemberAccessType>(member.access_type ?? "30d");
  const [expiresAt, setExpiresAt]     = useState(member.expires_at ?? "");
  const [entryDate, setEntryDate]     = useState(member.entry_date);

  const [saving, setSaving]     = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  async function handleSave() {
    if (!name.trim())  { setError("Nome é obrigatório"); return; }
    if (!email.trim()) { setError("E-mail é obrigatório"); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          product: product.trim() || null,
          origin: origin.trim() || null,
          notes: notes.trim() || null,
          profile,
          access_type: accessType,
          expires_at: expiresAt || null,
          entry_date: entryDate,
        }),
      });
      const data = await res.json<{ error?: string }>();
      if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${member.id}/toggle`, { method: "POST" });
      if (!res.ok) { const d = await res.json<{ error?: string }>(); setError(d.error ?? "Erro"); return; }
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remover o usuário "${member.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json<{ error?: string }>(); setError(d.error ?? "Erro"); return; }
      router.push("/admin/usuarios");
    } finally {
      setDeleting(false);
    }
  }

  const isActive = member.status === "active";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-text">Dados do usuário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nome *">
            <input value={name} onChange={e => setName(e.target.value)} className={INPUT} />
          </Field>
          <Field label="E-mail *">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Telefone">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={INPUT} />
          </Field>
          <Field label="Data de entrada">
            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Perfil">
            <select value={profile} onChange={e => setProfile(e.target.value as MemberProfile)} className={SELECT}>
              <option value="user">Usuário</option>
              <option value="support">Suporte</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
          <Field label="Tipo de acesso">
            <select value={accessType} onChange={e => setAccessType(e.target.value as MemberAccessType)} className={SELECT}>
              <option value="30d">30 dias</option>
              <option value="90d">90 dias</option>
              <option value="365d">365 dias</option>
              <option value="lifetime">Vitalício</option>
            </select>
          </Field>
          <Field label="Data de expiração">
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Produto adquirido">
            <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Calendário Sanitário VPC" className={INPUT} />
          </Field>
          <Field label="Origem da compra">
            <select value={origin} onChange={e => setOrigin(e.target.value)} className={SELECT}>
              <option value="">—</option>
              <option value="Manual">Manual</option>
              <option value="Hotmart">Hotmart</option>
              <option value="Kiwify">Kiwify</option>
              <option value="PerfectPay">PerfectPay</option>
              <option value="Eduzz">Eduzz</option>
              <option value="Outro">Outro</option>
            </select>
          </Field>
        </div>
        <Field label="Observações internas">
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas internas..." className={TEXTAREA} />
        </Field>
      </div>

      {(member.calendar_id || member.calendar_request_id) && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-text">Calendário vinculado</h2>
          <div className="flex flex-wrap gap-3 text-sm text-text-muted">
            {member.farm_name && <span>Propriedade: <strong className="text-text">{member.farm_name}</strong></span>}
            {member.request_status && <span>Status: <strong className="text-text">{member.request_status}</strong></span>}
            {member.calendar_id && (
              <a href={`/admin/calendarios/${member.calendar_id}`} className="underline underline-offset-2 hover:text-text">
                Ver calendário ↗
              </a>
            )}
          </div>
        </div>
      )}

      {error   && <p className="text-sm text-red">{error}</p>}
      {success && <p className="text-sm text-green">Salvo com sucesso!</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-sm px-4 h-9 rounded-md border border-border hover:bg-text/5 transition-colors disabled:opacity-50"
          >
            {isActive ? <><Lock className="h-4 w-4" /> Bloquear acesso</> : <><Unlock className="h-4 w-4" /> Desbloquear acesso</>}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-sm px-4 h-9 rounded-md text-red border border-red/40 hover:bg-red/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Remover
          </button>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-1.5 text-sm px-5 h-9 rounded-md bg-text text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
