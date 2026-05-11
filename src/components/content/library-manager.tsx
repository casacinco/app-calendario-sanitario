"use client";

import { useRef, useState } from "react";
import {
  Plus, Trash2, FileText, Table, ImageIcon,
  FileSpreadsheet, File, ExternalLink, Download,
  Upload, X, Loader2, CheckCircle2,
} from "lucide-react";
import type { LibraryFile, ContentFileType } from "@/lib/db";
import { formatDateBR } from "@/lib/format";

// ─── Config ───────────────────────────────────────────────────────────────────

const FILE_TYPES: { value: ContentFileType; label: string; accept: string }[] = [
  { value: "pdf",         label: "PDF",       accept: ".pdf,application/pdf" },
  { value: "spreadsheet", label: "Planilha",  accept: ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" },
  { value: "image",       label: "Imagem",    accept: "image/jpeg,image/jpg,image/png,image/webp" },
  { value: "document",    label: "Documento", accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { value: "other",       label: "Outro",     accept: "*" },
];

const FILE_ICON: Record<ContentFileType, React.ElementType> = {
  pdf:         FileText,
  spreadsheet: FileSpreadsheet,
  image:       ImageIcon,
  document:    File,
  other:       File,
};

const FILE_COLOR: Record<ContentFileType, string> = {
  pdf:         "text-red-400",
  spreadsheet: "text-green",
  image:       "text-blue-400",
  document:    "text-text-muted",
  other:       "text-text-muted",
};

const INPUT  = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT = "rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const BTN_PRI   = "px-4 py-2 bg-text text-bg text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity";
const BTN_GHOST = "px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md transition-colors";

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Pending upload state ─────────────────────────────────────────────────────

interface PendingFile {
  url:           string;
  name:          string;   // original filename
  size:          number;
  type:          string;   // mime
}

// ─── Add form ─────────────────────────────────────────────────────────────────

interface AddForm {
  name:      string;
  file_type: ContentFileType;
  notes:     string;
}
const EMPTY_FORM: AddForm = { name: "", file_type: "pdf", notes: "" };

// ─── LibraryManager ───────────────────────────────────────────────────────────

interface Props { initialFiles: LibraryFile[]; }

export function LibraryManager({ initialFiles }: Props) {
  const [files,      setFiles]      = useState(initialFiles);
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState<AddForm>(EMPTY_FORM);
  const [pending,    setPending]    = useState<PendingFile | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState("");
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [search,     setSearch]     = useState("");
  const [dragOver,   setDragOver]   = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Filtering ──

  const filtered = files.filter((file) => {
    if (filterType !== "all" && file.file_type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!file.name.toLowerCase().includes(q) && !(file.notes ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── File upload ──

  async function handleFileUpload(file: File) {
    setUploadErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",   file);
      fd.append("folder", "library");

      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; name?: string; size?: number; type?: string; error?: string };

      if (!res.ok || !data.url) {
        setUploadErr(data.error ?? "Erro ao enviar arquivo");
        return;
      }

      setPending({ url: data.url, name: data.name ?? file.name, size: data.size ?? file.size, type: data.type ?? file.type });

      // Auto-fill name from filename (strip extension) if name is empty
      if (!form.name.trim()) {
        const base = file.name.replace(/\.[^.]+$/, "");
        setForm((p) => ({ ...p, name: base }));
      }

      // Auto-detect file_type from mime
      const mime = data.type ?? file.type;
      if (mime === "application/pdf")                                    setForm((p) => ({ ...p, file_type: "pdf" }));
      else if (mime.includes("spreadsheet") || mime === "text/csv")      setForm((p) => ({ ...p, file_type: "spreadsheet" }));
      else if (mime.startsWith("image/"))                                setForm((p) => ({ ...p, file_type: "image" }));
      else if (mime.includes("word"))                                    setForm((p) => ({ ...p, file_type: "document" }));

    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  // ── Form submit ──

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) { setFormErr("Selecione um arquivo primeiro"); return; }
    if (!form.name.trim()) { setFormErr("Nome é obrigatório"); return; }

    setSaving(true); setFormErr("");
    try {
      const res = await fetch("/api/admin/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          form.name.trim(),
          url:           pending.url,
          file_type:     form.file_type,
          notes:         form.notes || null,
          file_size:     pending.size,
          original_name: pending.name,
        }),
      });
      const data = await res.json() as { error?: string; file?: LibraryFile };
      if (!res.ok) { setFormErr(data.error ?? "Erro"); return; }
      if (data.file) setFiles((prev) => [data.file!, ...prev]);
      setForm(EMPTY_FORM); setPending(null); setShowAdd(false);
    } finally { setSaving(false); }
  }

  // ── Delete ──

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await fetch(`/api/admin/library/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setDeleteId(null);
    } finally { setDeleting(false); }
  }

  // ── Helpers ──

  function cancelAdd() {
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setPending(null);
    setUploadErr("");
    setFormErr("");
  }

  return (
    <div className="space-y-4">

      {/* ── Add form ── */}
      {showAdd ? (
        <form onSubmit={handleAdd} className="border border-border rounded-xl p-4 space-y-4 bg-card">
          <h3 className="font-medium text-sm">Adicionar arquivo</h3>

          {/* Drop zone / file picker */}
          {pending ? (
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-green/5 border border-green/20">
              <CheckCircle2 className="h-4 w-4 text-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pending.name}</p>
                <p className="text-xs text-text-muted">{formatBytes(pending.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setPending(null); setUploadErr(""); }}
                className="p-1 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              className={`rounded-lg border-2 border-dashed transition-colors ${dragOver ? "border-text/40 bg-text/5" : "border-border hover:border-text/30"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-text-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Enviando…</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-8 text-text-muted hover:text-text transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">
                    Arraste aqui ou <span className="underline underline-offset-2">clique para selecionar</span>
                  </span>
                  <span className="text-xs text-text-muted">
                    PDF, XLS, XLSX, CSV, DOC, DOCX, JPG, PNG, WEBP · máx. 25 MB
                  </span>
                </button>
              )}
            </div>
          )}

          {uploadErr && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <X className="h-3 w-3 flex-shrink-0" /> {uploadErr}
            </p>
          )}

          {/* Metadata fields */}
          {pending && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Nome *</label>
                <input
                  className={INPUT}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome para exibição"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Tipo</label>
                <select
                  className={SELECT}
                  value={form.file_type}
                  onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value as ContentFileType }))}
                >
                  {FILE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-text-muted">Observações</label>
                <input
                  className={INPUT}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>
          )}

          {formErr && (
            <p className="text-xs text-red-400">{formErr}</p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving || uploading || !pending} className={BTN_PRI}>
              {saving ? "Salvando…" : "Adicionar"}
            </button>
            <button type="button" onClick={cancelAdd} className={BTN_GHOST}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl text-sm text-text-muted hover:text-text hover:border-text/30 transition-colors w-full"
        >
          <Plus className="h-4 w-4" /> Adicionar arquivo
        </button>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors flex-1"
          style={{ maxWidth: 240 }}
          placeholder="Buscar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={SELECT} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">Todos os tipos</option>
          {FILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* ── File list ── */}
      {filtered.length === 0 ? (
        <p className="text-text-muted text-sm py-8 text-center">Nenhum arquivo encontrado.</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((file) => {
            const Icon = FILE_ICON[file.file_type] ?? File;
            const isImage = file.file_type === "image";
            return (
              <div key={file.id}>
                <div className="border border-border rounded-xl bg-card flex items-center gap-3 px-4 py-3">
                  {isImage && file.url ? (
                    <img src={file.url} alt="" className="h-10 w-14 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <Icon className={`h-5 w-5 flex-shrink-0 ${FILE_COLOR[file.file_type]}`} />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">
                        {FILE_TYPES.find((t) => t.value === file.file_type)?.label}
                      </span>
                      {file.file_size && (
                        <span className="text-[10px] text-text-muted">{formatBytes(file.file_size)}</span>
                      )}
                      {file.original_name && file.original_name !== file.name && (
                        <span className="text-[10px] text-text-muted truncate max-w-[140px]" title={file.original_name}>
                          {file.original_name}
                        </span>
                      )}
                      {file.notes && (
                        <span className="text-[11px] text-text-muted truncate">{file.notes}</span>
                      )}
                      <span className="text-[10px] text-text-muted">{formatDateBR(file.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {/* Preview / Open */}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visualizar"
                      className="p-1.5 rounded-lg hover:bg-text/5 text-text-muted hover:text-text transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    {/* Download */}
                    <a
                      href={file.url}
                      download={file.original_name ?? file.name}
                      title="Baixar"
                      className="p-1.5 rounded-lg hover:bg-text/5 text-text-muted hover:text-text transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteId(file.id)}
                      title="Excluir"
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {deleteId === file.id && (
                  <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-xl px-4 py-3 flex items-center gap-3">
                    <p className="text-sm flex-1">Remover <strong>{file.name}</strong> da biblioteca?</p>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Remover
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-text-muted">
        {filtered.length} arquivo{filtered.length !== 1 ? "s" : ""}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={FILE_TYPES.map((t) => t.accept).join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
