"use client";

import { useState, useEffect } from "react";
import {
  ArrowRightLeft, Upload, RefreshCw, Check, FileText,
  User, StickyNote, Calendar, Clock, ChevronDown, History,
} from "lucide-react";
import type { MigrationStatus, MigrationAssigneeRole, CalendarRequest, MigrationEvent } from "@/lib/db";

interface Props {
  request: CalendarRequest;
}

// Internal labels (admin-facing only)
const STATUS_LABELS: Record<MigrationStatus, string> = {
  awaiting_migration: "Aguardando migração",
  in_migration:       "Em migração",
  internal_review:    "Revisão interna",
  published:          "Publicado",
  delivered:          "Entregue",
};

const STATUS_COLORS: Record<MigrationStatus, string> = {
  awaiting_migration: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_migration:       "bg-blue-500/10  text-blue-400  border-blue-500/20",
  internal_review:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  published:          "bg-green-500/10 text-green-400  border-green-500/20",
  delivered:          "bg-green-500/10 text-green-400  border-green-500/20",
};

const ASSIGNEE_LABELS: Record<MigrationAssigneeRole, string> = {
  operador:       "Operador",
  suporte:        "Suporte",
  equipe_interna: "Equipe interna",
  administrador:  "Administrador",
};

const MIGRATION_STATUSES: MigrationStatus[] = [
  "awaiting_migration", "in_migration", "internal_review", "published", "delivered",
];

const ASSIGNEE_ROLES: MigrationAssigneeRole[] = [
  "operador", "suporte", "equipe_interna", "administrador",
];

const EVENT_LABELS: Record<string, string> = {
  form_submitted:   "Formulário enviado pelo usuário",
  status_changed:   "Status atualizado",
  assignee_set:     "Responsável atribuído",
  pdf_uploaded:     "PDF anexado",
  notes_updated:    "Observações atualizadas",
  created_manual:   "Criado manualmente",
  delivery_set:     "Previsão de entrega definida",
};

const INPUT = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-text-muted transition-colors";

function fmtDateTime(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt + "T00:00:00").toLocaleDateString("pt-BR");
}

export function MigrationPanel({ request }: Props) {
  const [migStatus,     setMigStatus]     = useState<MigrationStatus | "">(request.migration_status ?? "");
  const [assigneeRole,  setAssigneeRole]  = useState<MigrationAssigneeRole | "">(request.migration_assignee_role ?? "");
  const [notes,         setNotes]         = useState(request.migration_notes ?? "");
  const [pdfUrl,        setPdfUrl]        = useState(request.migration_pdf_url ?? "");
  const [deliveryDate,  setDeliveryDate]  = useState(request.estimated_delivery_date ?? "");
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [err,           setErr]           = useState<string | null>(null);
  const [history,       setHistory]       = useState<MigrationEvent[] | null>(null);
  const [showHistory,   setShowHistory]   = useState(false);
  const [historyLoad,   setHistoryLoad]   = useState(false);

  async function loadHistory() {
    if (history !== null) { setShowHistory(s => !s); return; }
    setHistoryLoad(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/migration/history`);
      const j   = await res.json<{ events: MigrationEvent[] }>();
      setHistory(j.events ?? []);
      setShowHistory(true);
    } catch { setHistory([]); setShowHistory(true); }
    finally  { setHistoryLoad(false); }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "migration-pdfs");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json<{ error?: string }>()).error ?? "Erro no upload");
      const j = await res.json<{ url: string }>();
      setPdfUrl(j.url);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro no upload"); }
    finally      { setUploading(false); }
  }

  async function handleSave() {
    setSaving(true); setErr(null);
    try {
      const body: Record<string, unknown> = {
        migration_status:        migStatus    || null,
        migration_pdf_url:       pdfUrl       || null,
        migration_assignee_role: assigneeRole || null,
        migration_notes:         notes.trim() || null,
        estimated_delivery_date: deliveryDate || null,
      };
      const res = await fetch(`/api/admin/requests/${request.id}/migration`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json<{ error?: string }>()).error ?? "Erro ao salvar");
      setSaved(true);
      setHistory(null); // force reload next time
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally      { setSaving(false); }
  }

  const cs = migStatus ? STATUS_COLORS[migStatus] : "bg-text/5 text-text-muted border-border";
  const cl = migStatus ? STATUS_LABELS[migStatus] : "Sem status";

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <ArrowRightLeft className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-text">Gestão da Migração</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cs}`}>{cl}</span>
        {request.migration_source && (
          <span className="text-xs px-2 py-0.5 rounded-full border bg-text/5 text-text-muted border-border capitalize">
            {request.migration_source === "manual" ? "Manual" : request.migration_source}
          </span>
        )}
      </div>

      {/* Operational timestamps (read-only) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Início migração",   value: fmtDateTime(request.migration_started_at) },
          { label: "Publicado em",      value: fmtDateTime(request.migration_published_at) },
          { label: "Responsável desde", value: fmtDateTime(request.migration_assigned_at) },
          { label: "Solicitação",       value: fmtDateTime(request.created_at) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card px-3 py-2 space-y-0.5">
            <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
            <p className="text-xs text-text font-medium">{value}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <ChevronDown className="h-3 w-3" /> Status
          </label>
          <select value={migStatus} onChange={e => setMigStatus(e.target.value as MigrationStatus | "")} className={INPUT}>
            <option value="">— Selecionar —</option>
            {MIGRATION_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Assignee role */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <User className="h-3 w-3" /> Responsável
          </label>
          <select value={assigneeRole} onChange={e => setAssigneeRole(e.target.value as MigrationAssigneeRole | "")} className={INPUT}>
            <option value="">— Selecionar —</option>
            {ASSIGNEE_ROLES.map(r => (
              <option key={r} value={r}>{ASSIGNEE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Estimated delivery */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> Previsão de entrega
          </label>
          <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={INPUT} />
        </div>

      </div>

      {/* PDF */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
          <FileText className="h-3 w-3" /> PDF do calendário original
        </label>
        {pdfUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-green/20 bg-green/5 px-3 py-2.5">
            <FileText className="h-4 w-4 text-green flex-shrink-0" />
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-green hover:underline truncate flex-1">Ver PDF anexado</a>
            <button type="button" onClick={() => setPdfUrl("")}
              className="text-xs text-text-muted hover:text-red transition-colors">Remover</button>
          </div>
        ) : (
          <label className={`flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border px-3 py-3 hover:border-text-muted transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading
              ? <RefreshCw className="h-4 w-4 animate-spin text-text-muted" />
              : <Upload className="h-4 w-4 text-text-muted" />
            }
            <span className="text-sm text-text-muted">{uploading ? "Enviando…" : "Upload do PDF original"}</span>
            <input type="file" accept="application/pdf" className="sr-only" onChange={handlePdfUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide flex items-center gap-1.5">
          <StickyNote className="h-3 w-3" /> Observações internas
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Localização do PDF, histórico, instruções para a equipe…"
          rows={3} className={INPUT + " resize-none"} />
      </div>

      {err && (
        <p className="text-xs text-red bg-red/10 border border-red/20 rounded-lg px-3 py-2">{err}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving || uploading}
          className="flex items-center gap-2 h-9 px-4 rounded-md bg-card border border-border text-sm font-medium text-text hover:bg-text/5 transition-colors disabled:opacity-50">
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : saved  ? <Check className="h-3.5 w-3.5 text-green" /> : null}
          {saved ? "Salvo" : "Salvar alterações"}
        </button>

        {/* History toggle */}
        <button type="button" onClick={loadHistory} disabled={historyLoad}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors">
          {historyLoad ? <RefreshCw className="h-3 w-3 animate-spin" /> : <History className="h-3 w-3" />}
          Histórico
          <ChevronDown className={`h-3 w-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* History */}
      {showHistory && history !== null && (
        <div className="space-y-1 border-t border-border pt-3">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            Histórico de eventos
          </p>
          {history.length === 0 ? (
            <p className="text-xs text-text-muted/50 italic">Nenhum evento registrado.</p>
          ) : (
            history.map(ev => (
              <div key={ev.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                <Clock className="h-3 w-3 text-text-muted/40 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text">
                    {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                    {ev.old_value && ev.new_value && (
                      <span className="text-text-muted/60 ml-1">
                        {ev.old_value} → {ev.new_value}
                      </span>
                    )}
                    {ev.new_value && !ev.old_value && (
                      <span className="text-text-muted/60 ml-1">→ {ev.new_value}</span>
                    )}
                  </p>
                  {ev.performed_by && (
                    <p className="text-[10px] text-text-muted/50">{ev.performed_by}</p>
                  )}
                  {ev.notes && (
                    <p className="text-[10px] text-text-muted/60 italic">{ev.notes}</p>
                  )}
                </div>
                <time className="text-[9px] text-text-muted/40 whitespace-nowrap flex-shrink-0">
                  {fmtDateTime(ev.created_at)}
                </time>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
