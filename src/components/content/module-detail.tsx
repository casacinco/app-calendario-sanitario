"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Pencil, Trash2, PlayCircle, FileText, Clock, Layers } from "lucide-react";
import type { ContentModule, ContentLesson, LessonStatus, ModuleStatus } from "@/lib/db";

const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  published: "Publicada",
  draft:     "Rascunho",
  hidden:    "Oculta",
};
const LESSON_STATUS_CLASS: Record<LessonStatus, string> = {
  published: "bg-green/15 text-green border-green/30",
  draft:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hidden:    "bg-text-muted/10 text-text-muted border-border",
};

const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  active: "Ativo", hidden: "Oculto", blocked: "Bloqueado",
};

const INPUT = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT = "rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const TEXTAREA = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors resize-none";

interface LessonForm {
  title: string; description: string; video_url: string;
  thumbnail_url: string; duration_minutes: string; status: LessonStatus;
}
const EMPTY_LESSON: LessonForm = { title: "", description: "", video_url: "", thumbnail_url: "", duration_minutes: "", status: "draft" };

interface Props {
  module: ContentModule;
  initialLessons: ContentLesson[];
}

export function ModuleDetail({ module: initialModule, initialLessons }: Props) {
  const router = useRouter();
  const [mod, setMod] = useState(initialModule);
  const [lessons, setLessons] = useState(initialLessons);

  // Module edit state
  const [editingModule, setEditingModule] = useState(false);
  const [modForm, setModForm] = useState({
    title: mod.title, description: mod.description ?? "", thumbnail_url: mod.thumbnail_url ?? "",
    accent_color: mod.accent_color, status: mod.status as ModuleStatus,
  });

  // Lesson state
  const [showCreate, setShowCreate] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [editLessonId, setEditLessonId] = useState<number | null>(null);
  const [editLessonForm, setEditLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Drag
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const mf = (patch: Partial<typeof modForm>) => setModForm((p) => ({ ...p, ...patch }));
  const lf = (patch: Partial<LessonForm>) => setLessonForm((p) => ({ ...p, ...patch }));
  const elf = (patch: Partial<LessonForm>) => setEditLessonForm((p) => ({ ...p, ...patch }));

  async function saveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!modForm.title.trim()) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/admin/modules/${mod.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...modForm, description: modForm.description || null, thumbnail_url: modForm.thumbnail_url || null }),
      });
      const data = await res.json() as { error?: string; module?: ContentModule };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      setMod((prev) => ({ ...prev, ...(data.module ?? {}) }));
      setEditingModule(false);
    } finally { setSaving(false); }
  }

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonForm.title.trim()) { setErr("Título é obrigatório"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: mod.id, title: lessonForm.title, description: lessonForm.description || null,
          video_url: lessonForm.video_url || null, thumbnail_url: lessonForm.thumbnail_url || null,
          duration_minutes: lessonForm.duration_minutes ? Number(lessonForm.duration_minutes) : null,
          status: lessonForm.status,
        }),
      });
      const data = await res.json() as { error?: string; lesson?: ContentLesson };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      if (data.lesson) setLessons((prev) => [...prev, data.lesson!]);
      setLessonForm(EMPTY_LESSON);
      setShowCreate(false);
    } finally { setSaving(false); }
  }

  function startEditLesson(l: ContentLesson) {
    setEditLessonId(l.id);
    setEditLessonForm({
      title: l.title, description: l.description ?? "", video_url: l.video_url ?? "",
      thumbnail_url: l.thumbnail_url ?? "", duration_minutes: l.duration_minutes?.toString() ?? "", status: l.status,
    });
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editLessonForm.title.trim() || editLessonId === null) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/admin/lessons/${editLessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editLessonForm.title, description: editLessonForm.description || null,
          video_url: editLessonForm.video_url || null, thumbnail_url: editLessonForm.thumbnail_url || null,
          duration_minutes: editLessonForm.duration_minutes ? Number(editLessonForm.duration_minutes) : null,
          status: editLessonForm.status,
        }),
      });
      const data = await res.json() as { error?: string; lesson?: ContentLesson };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      setLessons((prev) => prev.map((l) => l.id === editLessonId ? { ...l, ...(data.lesson ?? {}) } : l));
      setEditLessonId(null);
    } finally { setSaving(false); }
  }

  async function deleteLesson(id: number) {
    setSaving(true);
    try {
      await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
      setLessons((prev) => prev.filter((l) => l.id !== id));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e: React.DragEvent, index: number) { e.preventDefault(); setOverIndex(index); }
  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null; setOverIndex(null);
    if (from === null || from === dropIndex) return;
    const reordered = [...lessons];
    const moved = reordered.splice(from, 1)[0]!;
    reordered.splice(dropIndex, 0, moved);
    setLessons(reordered);
    await fetch("/api/admin/lessons/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id: mod.id, ids: reordered.map((l) => l.id) }),
    });
  }

  return (
    <div className="space-y-8">
      {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{err}</p>}

      {/* Module info */}
      <section className="border border-border rounded-lg bg-card">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: mod.accent_color }} />
          <Layers className="h-4 w-4 text-text-muted" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">{mod.title}</h2>
              <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${{active:"bg-green/15 text-green border-green/30",hidden:"bg-text-muted/10 text-text-muted border-border",blocked:"bg-red-500/15 text-red-400 border-red-500/30"}[mod.status]}`}>
                {MODULE_STATUS_LABEL[mod.status]}
              </span>
            </div>
            {mod.description && <p className="text-xs text-text-muted mt-0.5">{mod.description}</p>}
          </div>
          <button
            onClick={() => setEditingModule(!editingModule)}
            className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {editingModule && (
          <form onSubmit={saveModule} className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Título *</label>
                <input className={INPUT} value={modForm.title} onChange={(e) => mf({ title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Status</label>
                <select className={SELECT} value={modForm.status} onChange={(e) => mf({ status: e.target.value as ModuleStatus })}>
                  <option value="active">Ativo</option>
                  <option value="hidden">Oculto</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-text-muted">Descrição</label>
                <input className={INPUT} value={modForm.description} onChange={(e) => mf({ description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">URL da capa</label>
                <input className={INPUT} value={modForm.thumbnail_url} onChange={(e) => mf({ thumbnail_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Cor de destaque</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={modForm.accent_color} onChange={(e) => mf({ accent_color: e.target.value })} className="h-9 w-14 rounded border border-border cursor-pointer bg-bg" />
                  <input className={INPUT} value={modForm.accent_color} onChange={(e) => mf({ accent_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-bg text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
                {saving ? "Salvando…" : "Salvar"}
              </button>
              <button type="button" onClick={() => setEditingModule(false)} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">Cancelar</button>
            </div>
          </form>
        )}
      </section>

      {/* Lessons */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Aulas <span className="text-text-muted font-normal text-sm">({lessons.length})</span></h3>
        </div>

        {showCreate ? (
          <form onSubmit={createLesson} className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <h4 className="font-medium text-sm">Nova aula</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Título *</label>
                <input className={INPUT} value={lessonForm.title} onChange={(e) => lf({ title: e.target.value })} placeholder="Título da aula" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Status</label>
                <select className={SELECT} value={lessonForm.status} onChange={(e) => lf({ status: e.target.value as LessonStatus })}>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicada</option>
                  <option value="hidden">Oculta</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-text-muted">Descrição</label>
                <textarea className={TEXTAREA} rows={2} value={lessonForm.description} onChange={(e) => lf({ description: e.target.value })} placeholder="Sobre esta aula…" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">URL do vídeo</label>
                <input className={INPUT} value={lessonForm.video_url} onChange={(e) => lf({ video_url: e.target.value })} placeholder="Vimeo ou YouTube" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Duração (minutos)</label>
                <input type="number" className={INPUT} value={lessonForm.duration_minutes} onChange={(e) => lf({ duration_minutes: e.target.value })} placeholder="Ex: 45" min="1" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-text-muted">URL da thumbnail</label>
                <input className={INPUT} value={lessonForm.thumbnail_url} onChange={(e) => lf({ thumbnail_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-bg text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
                {saving ? "Salvando…" : "Criar aula"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setLessonForm(EMPTY_LESSON); }} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">Cancelar</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-sm text-text-muted hover:text-text hover:border-text/30 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nova aula
          </button>
        )}

        {lessons.length === 0 && !showCreate && (
          <p className="text-text-muted text-sm py-6 text-center">Nenhuma aula neste módulo.</p>
        )}

        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <div key={lesson.id}>
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
                <div className="flex items-center gap-3 p-3">
                  <GripVertical className="h-4 w-4 text-text-muted cursor-grab flex-shrink-0" />

                  {lesson.thumbnail_url ? (
                    <img src={lesson.thumbnail_url} alt="" className="h-9 w-14 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="h-9 w-14 rounded bg-text/5 flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="h-4 w-4 text-text-muted" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{lesson.title}</span>
                      <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${LESSON_STATUS_CLASS[lesson.status]}`}>
                        {LESSON_STATUS_LABEL[lesson.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {lesson.video_url && <span className="text-[10px] text-text-muted flex items-center gap-1"><PlayCircle className="h-3 w-3" /> Vídeo</span>}
                      {lesson.duration_minutes && <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.duration_minutes}min</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => editLessonId === lesson.id ? setEditLessonId(null) : startEditLesson(lesson)} className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(lesson.id)} className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {editLessonId === lesson.id && (
                  <form onSubmit={saveLesson} className="border-t border-border p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Título *</label>
                        <input className={INPUT} value={editLessonForm.title} onChange={(e) => elf({ title: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Status</label>
                        <select className={SELECT} value={editLessonForm.status} onChange={(e) => elf({ status: e.target.value as LessonStatus })}>
                          <option value="draft">Rascunho</option>
                          <option value="published">Publicada</option>
                          <option value="hidden">Oculta</option>
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-text-muted">Descrição</label>
                        <textarea className={TEXTAREA} rows={2} value={editLessonForm.description} onChange={(e) => elf({ description: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">URL do vídeo</label>
                        <input className={INPUT} value={editLessonForm.video_url} onChange={(e) => elf({ video_url: e.target.value })} placeholder="Vimeo ou YouTube" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Duração (min)</label>
                        <input type="number" className={INPUT} value={editLessonForm.duration_minutes} onChange={(e) => elf({ duration_minutes: e.target.value })} min="1" />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-text-muted">URL da thumbnail</label>
                        <input className={INPUT} value={editLessonForm.thumbnail_url} onChange={(e) => elf({ thumbnail_url: e.target.value })} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-bg text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
                        {saving ? "Salvando…" : "Salvar"}
                      </button>
                      <button type="button" onClick={() => setEditLessonId(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">Cancelar</button>
                    </div>
                  </form>
                )}
              </div>

              {deleteId === lesson.id && (
                <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 flex items-center gap-3">
                  <p className="text-sm flex-1">Excluir <strong>{lesson.title}</strong>?</p>
                  <button onClick={() => deleteLesson(lesson.id)} disabled={saving} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50">Excluir</button>
                  <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5">Cancelar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
