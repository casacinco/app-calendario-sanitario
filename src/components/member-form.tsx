"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, Trash2 } from "lucide-react";
import type { MemberWithRequest } from "@/lib/db";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:border-text-muted transition-colors";
const TEXTAREA =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors resize-none";

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberForm({
  member,
  isNew = false,
}: {
  member?: MemberWithRequest;
  isNew?: boolean;
}) {
  const router = useRouter();

  const [name, setName]           = useState(member?.name ?? "");
  const [email, setEmail]         = useState(member?.email ?? "");
  const [phone, setPhone]         = useState(member?.phone ?? "");
  const [product, setProduct]     = useState(member?.product ?? "");
  const [origin, setOrigin]       = useState(member?.origin ?? "");
  const [notes, setNotes]         = useState(member?.notes ?? "");
  const [entryDate, setEntryDate] = useState(member?.entry_date ?? new Date().toISOString().split("T")[0]);
  const [requestId, setRequestId] = useState(
    member?.calendar_request_id ? String(member.calendar_request_id) : "",
  );

  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return; }
    if (!email.trim()) { setError("E-mail é obrigatório"); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const body = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        product: product.trim() || null,
        origin: origin.trim() || null,
        notes: notes.trim() || null,
        entry_date: entryDate,
        calendar_request_id: requestId ? Number(requestId) : null,
      };
      if (isNew) {
        const res = await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json<{ member?: { id: number }; error?: string }>();
        if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
        router.push(`/admin/usuarios/${data.member!.id}`);
      } else {
        const res = await fetch(`/api/admin/members/${member!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json<{ error?: string }>();
        if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!member) return;
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
    if (!member) return;
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

  const isActive = member?.status === "active";

  return (
    <div className="space-y-6">
      {/* Dados básicos */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-text">Dados básicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nome *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className={INPUT}
            />
          </Field>
          <Field label="E-mail *">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className={INPUT}
            />
          </Field>
          <Field label="Telefone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className={INPUT}
            />
          </Field>
          <Field label="Data de entrada">
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Produto adquirido">
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Ex: Calendário Sanitário VPC"
              className={INPUT}
            />
          </Field>
          <Field label="Origem da compra">
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ex: Hotmart, indicação, Instagram..."
              className={INPUT}
            />
          </Field>
        </div>
        <Field label="Observações">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas sobre este usuário..."
            className={TEXTAREA}
          />
        </Field>
      </div>

      {/* Vínculo com calendário */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text">Calendário vinculado</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Informe o ID da solicitação de calendário para vincular este usuário.
          </p>
        </div>
        <Field label="ID da solicitação">
          <input
            value={requestId}
            onChange={(e) => setRequestId(e.target.value.replace(/\D/g, ""))}
            placeholder="Ex: 12"
            className={`${INPUT} max-w-[160px]`}
          />
        </Field>
        {member?.calendar_request_id && (
          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            {member.farm_name && <span>Propriedade: <strong className="text-text">{member.farm_name}</strong></span>}
            {member.request_status && <span>Status: <strong className="text-text">{member.request_status}</strong></span>}
            {member.calendar_id && (
              <a
                href={`/admin/calendarios/${member.calendar_id}`}
                className="underline underline-offset-2 hover:text-text"
              >
                Ver calendário ↗
              </a>
            )}
          </div>
        )}
      </div>

      {/* Error / success */}
      {error && <p className="text-sm text-red">{error}</p>}
      {success && <p className="text-sm text-green">Salvo com sucesso!</p>}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {!isNew && (
            <>
              <button
                type="button"
                disabled={toggling}
                onClick={handleToggle}
                className="flex items-center gap-1.5 text-sm px-4 h-9 rounded-md border border-border hover:bg-text/5 transition-colors disabled:opacity-50"
              >
                {isActive ? (
                  <><UserX className="h-4 w-4" /> Desativar acesso</>
                ) : (
                  <><UserCheck className="h-4 w-4" /> Ativar acesso</>
                )}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-sm px-4 h-9 rounded-md text-red border border-red/40 hover:bg-red/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Remover
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-1.5 text-sm px-5 h-9 rounded-md bg-text text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Salvando..." : isNew ? "Criar usuário" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
