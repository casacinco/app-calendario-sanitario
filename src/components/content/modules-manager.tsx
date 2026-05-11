"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Pencil, Trash2, Eye, EyeOff, Lock, ChevronRight } from "lucide-react";
import type { ContentModule, ModuleStatus } from "@/lib/db";

const STATUS_LABEL: Record<ModuleStatus, string> = {
  active: "Ativo",
  hidden: "Oculto",
  blocked: "Bloqueado",
};
const STATUS_CLASS: Record<ModuleStatus, string> = {
  active:  "bg-green/15 text-green border-green/30",
  hidden:  "bg-text-muted/10 text-text-muted border-border",
  blocked: "bg-red-500/15 text-red-400 border-red-500/30",
};

const INPUT = "w-full rounded-md border border-border bg-background text-text px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-text/30";
const SELECT = "rounded-md border border-border bg-background text-text px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-text/30";

interface Props {
  initialModules: ContentModule[];
}

interface FormState {
  title: string;
  description: string;
  thumbnail_url: string;
  accent_color: string;
  status: ModuleStatus;
}

const EMPTY: FormState = { title: "", description: "", thumbnail_url: "", accent_color: "#5FAF3E", status: "active" };

export function ModulesManager({ initialModules }: Props) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const f = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));
  const ef = (patch: Partial<FormState>) => setEditForm((p) => ({ ...p, ...patch }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Título é obrigatório"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string; module?: ContentModule };
      if (!res.ok) { setErr(data.error ?? "Erro ao criar módulo"); return; }
      if (data.module) setModules((prev) => [...prev, data.module!]);
      setForm(EMPTY);
      setShowCreate(false);
    } finally { setSaving(false); }
  }

  function startEdit(mod: ContentModule) {
    setEditId(mod.id);
    setEditForm({
      title: mod.title,
      description: mod.description ?? "",
      thumbnail_url: mod.thumbnail_url ?? "",
      accent_color: mod.accent_color,
      status: mod.status,
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.title.trim() || editId === null) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/admin/modules/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, description: editForm.description || null, thumbnail_url: editForm.thumbnail_url || null }),
      });
      const data = await res.json() as { error?: string; module?: ContentModule };
      if (!res.ok) { setErr(data.error ?? "Erro ao salvar"); return; }
      setModules((prev) => prev.map((m) => m.id === editId ? { ...m, ...(data.module ?? {}) } : m));
      setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    try {
      await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
      setModules((prev) => prev.filter((m) => m.id !== id));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  async function handleStatusCycle(mod: ContentModule) {
    const next: ModuleStatus = mod.status === "active" ? "hidden" : mod.status === "hidden" ? "blocked" : "active";
    const res = await fetch(`/api/admin/modules/${mod.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, status: next } : m));
    else setErr(data.error ?? "Erro ao atualizar status");
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setOverIndex(index);
  }
  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === dropIndex) return;
    const reordered = [...modules];
    const moved = reordered.splice(from, 1)[0]!;
    reordered.splice(dropIndex, 0, moved);
    setModules(reordered);
    await fetch("/api/admin/modules/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((m) => m.id) }),
    });
  }

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{err}</p>}

      {/* Create form */}
      {showCreate ? (
        <form onSubmit={handleCreate} className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <h3 className="font-medium text-sm">Novo módulo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Título *</label>
              <input className={INPUT} value={form.title} onChange={(e) => f({ title: e.target.value })} placeholder="Ex: Manejo Sanitário" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Status</label>
              <select className={SELECT} value={form.status} onChange={(e) => f({ status: e.target.value as ModuleStatus })}>
                <option value="active">Ativo</option>
                <option value="hidden">Oculto</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-text-muted">Descrição</label>
              <input className={INPUT} value={form.description} onChange={(e) => f({ description: e.target.value })} placeholder="Descrição curta do módulo" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">URL da capa</label>
              <input className={INPUT} value={form.thumbnail_url} onChange={(e) => f({ thumbnail_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Cor de destaque</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.accent_color} onChange={(e) => f({ accent_color: e.target.value })} className="h-9 w-14 rounded border border-border cursor-pointer bg-background" />
                <input className={INPUT} value={form.accent_color} onChange={(e) => f({ accent_color: e.target.value })} placeholder="#5FAF3E" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
              {saving ? "Salvando…" : "Criar módulo"}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY); setErr(""); }} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-sm text-text-muted hover:text-text hover:border-text/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo módulo
        </button>
      )}

      {/* Modules list */}
      {modules.length === 0 && !showCreate && (
        <p className="text-text-muted text-sm py-8 text-center">Nenhum módulo criado ainda.</p>
      )}

      <div className="space-y-2">
        {modules.map((mod, index) => (
          <div key={mod.id}>
            {/* Drop zone indicator */}
            {overIndex === index && dragIndex.current !== null && dragIndex.current !== index && (
              <div className="h-1 bg-text/40 rounded mb-2" />
            )}

            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => { dragIndex.current = null; setOverIndex(null); }}
              className={`border border-border rounded-lg bg-card transition-opacity ${dragIndex.current === index ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Color bar */}
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: mod.accent_color }} />

                {/* Drag handle */}
                <GripVertical className="h-4 w-4 text-text-muted cursor-grab flex-shrink-0" />

                {/* Thumbnail */}
                {mod.thumbnail_url && (
                  <img src={mod.thumbnail_url} alt="" className="h-10 w-16 object-cover rounded flex-shrink-0" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{mod.title}</span>
                    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${STATUS_CLASS[mod.status]}`}>
                      {STATUS_LABEL[mod.status]}
                    </span>
                    <span className="text-[10px] text-text-muted border border-border rounded-full px-1.5 py-0.5">
                      {mod.lesson_count} {mod.lesson_count === 1 ? "aula" : "aulas"}
                    </span>
                  </div>
                  {mod.description && <p className="text-xs text-text-muted mt-0.5 truncate">{mod.description}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStatusCycle(mod)}
                    title={`Status: ${STATUS_LABEL[mod.status]}`}
                    className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors"
                  >
                    {mod.status === "active" ? <Eye className="h-4 w-4" /> : mod.status === "hidden" ? <EyeOff className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/conteudo/modulos/${mod.id}`)}
                    title="Gerenciar aulas"
                    className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => editId === mod.id ? setEditId(null) : startEdit(mod)}
                    title="Editar"
                    className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(mod.id)}
                    title="Excluir"
                    className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editId === mod.id && (
                <form onSubmit={handleEdit} className="border-t border-border p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">Título *</label>
                      <input className={INPUT} value={editForm.title} onChange={(e) => ef({ title: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">Status</label>
                      <select className={SELECT} value={editForm.status} onChange={(e) => ef({ status: e.target.value as ModuleStatus })}>
                        <option value="active">Ativo</option>
                        <option value="hidden">Oculto</option>
                        <option value="blocked">Bloqueado</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs text-text-muted">Descrição</label>
                      <input className={INPUT} value={editForm.description} onChange={(e) => ef({ description: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">URL da capa</label>
                      <input className={INPUT} value={editForm.thumbnail_url} onChange={(e) => ef({ thumbnail_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">Cor de destaque</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={editForm.accent_color} onChange={(e) => ef({ accent_color: e.target.value })} className="h-9 w-14 rounded border border-border cursor-pointer bg-background" />
                        <input className={INPUT} value={editForm.accent_color} onChange={(e) => ef({ accent_color: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
                      {saving ? "Salvando…" : "Salvar"}
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Confirm delete */}
            {deleteId === mod.id && (
              <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 flex items-center gap-3">
                <p className="text-sm flex-1">Excluir <strong>{mod.title}</strong>? Todas as aulas do módulo serão removidas.</p>
                <button onClick={() => handleDelete(mod.id)} disabled={saving} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50">
                  Excluir
                </button>
                <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
