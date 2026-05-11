"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Table, ImageIcon, Video, Link2, ExternalLink } from "lucide-react";
import type { LibraryFile, ContentFileType } from "@/lib/db";
import { formatDateBR } from "@/lib/format";

const FILE_TYPES: { value: ContentFileType; label: string }[] = [
  { value: "pdf",         label: "PDF" },
  { value: "spreadsheet", label: "Planilha" },
  { value: "image",       label: "Imagem" },
  { value: "video",       label: "Vídeo" },
  { value: "link",        label: "Link" },
];

const FILE_ICON: Record<ContentFileType, React.ElementType> = {
  pdf:         FileText,
  spreadsheet: Table,
  image:       ImageIcon,
  video:       Video,
  link:        Link2,
};

const FILE_COLOR: Record<ContentFileType, string> = {
  pdf:         "text-red-400",
  spreadsheet: "text-green",
  image:       "text-blue-400",
  video:       "text-purple-400",
  link:        "text-text-muted",
};

const INPUT = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT = "rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";

interface Props { initialFiles: LibraryFile[]; }

interface AddForm { name: string; url: string; file_type: ContentFileType; notes: string; }
const EMPTY: AddForm = { name: "", url: "", file_type: "link", notes: "" };

export function LibraryManager({ initialFiles }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const f = (patch: Partial<AddForm>) => setForm((p) => ({ ...p, ...patch }));

  const filtered = files.filter((file) => {
    if (filterType !== "all" && file.file_type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!file.name.toLowerCase().includes(q) && !(file.notes ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Nome é obrigatório"); return; }
    if (!form.url.trim()) { setErr("URL é obrigatória"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, notes: form.notes || null }),
      });
      const data = await res.json() as { error?: string; file?: LibraryFile };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      if (data.file) setFiles((prev) => [data.file!, ...prev]);
      setForm(EMPTY); setShowAdd(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    try {
      await fetch(`/api/admin/library/${id}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{err}</p>}

      {/* Add form */}
      {showAdd ? (
        <form onSubmit={handleAdd} className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <h3 className="font-medium text-sm">Adicionar arquivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Nome *</label>
              <input className={INPUT} value={form.name} onChange={(e) => f({ name: e.target.value })} placeholder="Ex: Manual de Vermifugação 2024" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Tipo</label>
              <select className={SELECT} value={form.file_type} onChange={(e) => f({ file_type: e.target.value as ContentFileType })}>
                {FILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-text-muted">URL *</label>
              <input className={INPUT} value={form.url} onChange={(e) => f({ url: e.target.value })} placeholder="https://drive.google.com/..." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-text-muted">Observações</label>
              <input className={INPUT} value={form.notes} onChange={(e) => f({ notes: e.target.value })} placeholder="Descrição opcional" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
              {saving ? "Adicionando…" : "Adicionar"}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY); setErr(""); }} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-sm text-text-muted hover:text-text hover:border-text/30 transition-colors">
          <Plus className="h-4 w-4" /> Adicionar arquivo
        </button>
      )}

      {/* Filters */}
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

      {filtered.length === 0 ? (
        <p className="text-text-muted text-sm py-8 text-center">Nenhum arquivo encontrado.</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((file) => {
            const Icon = FILE_ICON[file.file_type];
            return (
              <div key={file.id}>
                <div className="border border-border rounded-lg bg-card flex items-center gap-3 px-4 py-3">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${FILE_COLOR[file.file_type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">{FILE_TYPES.find((t) => t.value === file.file_type)?.label}</span>
                      {file.notes && <span className="text-[11px] text-text-muted truncate">{file.notes}</span>}
                      <span className="text-[10px] text-text-muted">{formatDateBR(file.created_at)}</span>
                    </div>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors flex-shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => setDeleteId(file.id)} className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {deleteId === file.id && (
                  <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 flex items-center gap-3">
                    <p className="text-sm flex-1">Remover <strong>{file.name}</strong> da biblioteca?</p>
                    <button onClick={() => handleDelete(file.id)} disabled={saving} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50">Remover</button>
                    <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5">Cancelar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-text-muted">{filtered.length} arquivo{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
