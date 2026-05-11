"use client";

import { useState, useRef } from "react";
import {
  GripVertical, Plus, Pencil, Trash2,
  Eye, EyeOff, Lock, ChevronDown, ChevronUp,
  PlayCircle, Clock, Loader2, Paperclip, X, FileText, Upload,
} from "lucide-react";
import type {
  ContentModule, ContentLesson, ContentLessonFile, LibraryFile,
  ModuleStatus, LessonStatus,
} from "@/lib/db";
import { MediaUpload } from "@/components/content/media-upload";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function mimeToFileType(mime: string): "pdf" | "spreadsheet" | "image" | "document" | "other" {
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return "spreadsheet";
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("word") || mime.includes("wordprocessingml")) return "document";
  return "other";
}

// ─── Styling constants ────────────────────────────────────────────────────────

const INPUT     = "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const SELECT    = "rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-text-muted transition-colors";
const BTN_PRI   = "px-4 py-2 bg-text text-bg text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity";
const BTN_GHOST = "px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md transition-colors";

// ─── Status maps ──────────────────────────────────────────────────────────────

const MOD_LABEL: Record<ModuleStatus, string> = { active: "Ativo", hidden: "Oculto", blocked: "Bloqueado" };
const MOD_CLASS: Record<ModuleStatus, string> = {
  active:  "bg-green/15 text-green border-green/30",
  hidden:  "bg-text-muted/10 text-text-muted border-border",
  blocked: "bg-red-500/15 text-red-400 border-red-500/30",
};
const LES_LABEL: Record<LessonStatus, string> = { published: "Publicada", draft: "Rascunho", hidden: "Oculta" };
const LES_CLASS: Record<LessonStatus, string> = {
  published: "bg-green/15 text-green border-green/30",
  draft:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hidden:    "bg-text-muted/10 text-text-muted border-border",
};

// ─── Form types ───────────────────────────────────────────────────────────────

interface ModuleForm {
  title: string; description: string; thumbnail_url: string;
  accent_color: string; status: ModuleStatus;
}
const EMPTY_MOD: ModuleForm = { title: "", description: "", thumbnail_url: "", accent_color: "#5FAF3E", status: "active" };

interface LessonForm {
  title: string; description: string; video_url: string;
  thumbnail_url: string; duration_minutes: string; status: LessonStatus;
}
const EMPTY_LES: LessonForm = { title: "", description: "", video_url: "", thumbnail_url: "", duration_minutes: "", status: "published" };

function modToForm(m: ContentModule): ModuleForm {
  return { title: m.title, description: m.description ?? "", thumbnail_url: m.thumbnail_url ?? "", accent_color: m.accent_color, status: m.status };
}
function lesToForm(l: ContentLesson): LessonForm {
  return { title: l.title, description: l.description ?? "", video_url: l.video_url ?? "", thumbnail_url: l.thumbnail_url ?? "", duration_minutes: l.duration_minutes ? String(l.duration_minutes) : "", status: l.status };
}

// ─── ModuleAccordionItem ─────────────────────────────────────────────────────

interface ModuleRowProps {
  mod: ContentModule;
  index: number;
  onUpdate: (m: ContentModule) => void;
  onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent, i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (e: React.DragEvent, i: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

function ModuleAccordionItem({ mod, index, onUpdate, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDropTarget }: ModuleRowProps) {
  const [expanded,      setExpanded]      = useState(false);
  const [lessons,       setLessons]       = useState<ContentLesson[]>([]);
  const [loaded,        setLoaded]        = useState(false);
  const [loadingLes,    setLoadingLes]    = useState(false);

  const [editingMod,    setEditingMod]    = useState(false);
  const [editForm,      setEditForm]      = useState<ModuleForm>(modToForm(mod));
  const [modSaving,     setModSaving]     = useState(false);
  const [modErr,        setModErr]        = useState("");
  const [delModConfirm, setDelModConfirm] = useState(false);

  const [showAddLes,    setShowAddLes]    = useState(false);
  const [addForm,       setAddForm]       = useState<LessonForm>(EMPTY_LES);
  const [editLesId,     setEditLesId]     = useState<number | null>(null);
  const [editLesForm,   setEditLesForm]   = useState<LessonForm>(EMPTY_LES);
  const [delLesId,      setDelLesId]      = useState<number | null>(null);
  const [lesSaving,     setLesSaving]     = useState(false);

  // ── Materials state ──
  const [lesFiles,     setLesFiles]     = useState<Record<number, ContentLessonFile[]>>({});
  const [library,      setLibrary]      = useState<LibraryFile[]>([]);
  const [libLoaded,    setLibLoaded]    = useState(false);
  const [libLoading,   setLibLoading]   = useState(false);
  const [matAdding,    setMatAdding]    = useState<number | null>(null);
  const [libSearch,    setLibSearch]    = useState("");
  const [lesUploading, setLesUploading] = useState(false);
  const [lesUploadErr, setLesUploadErr] = useState("");

  const lesUploadRef = useRef<HTMLInputElement>(null);

  const lesDragIdx = useRef<number | null>(null);
  const [lesOverIdx, setLesOverIdx] = useState<number | null>(null);

  // ── Materials helpers ──

  async function loadLessonFiles(lessonId: number) {
    if (lesFiles[lessonId] !== undefined) return;
    try {
      const res  = await fetch(`/api/admin/lessons/${lessonId}/files`);
      const data = await res.json() as { files?: ContentLessonFile[] };
      setLesFiles((p) => ({ ...p, [lessonId]: data.files ?? [] }));
    } catch {}
  }

  async function loadLibrary() {
    if (libLoaded || libLoading) return;
    setLibLoading(true);
    try {
      const res  = await fetch("/api/admin/library");
      const data = await res.json() as { files?: LibraryFile[] };
      setLibrary(data.files ?? []);
      setLibLoaded(true);
    } finally { setLibLoading(false); }
  }

  async function handleAddMaterial(lessonId: number, libFile: LibraryFile) {
    setMatAdding(libFile.id);
    try {
      const res  = await fetch(`/api/admin/lessons/${lessonId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: libFile.name, url: libFile.url, file_type: libFile.file_type }),
      });
      const data = await res.json() as { file?: ContentLessonFile };
      if (data.file) setLesFiles((p) => ({ ...p, [lessonId]: [...(p[lessonId] ?? []), data.file!] }));
    } finally { setMatAdding(null); }
  }

  async function handleRemoveMaterial(lessonId: number, fileId: number) {
    await fetch(`/api/admin/lessons/${lessonId}/files/${fileId}`, { method: "DELETE" });
    setLesFiles((p) => ({ ...p, [lessonId]: (p[lessonId] ?? []).filter((f) => f.id !== fileId) }));
  }

  async function handleLessonUpload(lessonId: number, file: File) {
    setLesUploading(true);
    setLesUploadErr("");
    try {
      // 1. Upload to R2
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "library");
      const uploadRes  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json() as { url?: string; name?: string; size?: number; type?: string; error?: string };
      if (!uploadRes.ok || !uploadData.url) {
        setLesUploadErr(uploadData.error ?? "Erro ao enviar arquivo");
        return;
      }

      const fileType   = mimeToFileType(uploadData.type ?? file.type);
      const displayName = file.name.replace(/\.[^.]+$/, "");

      // 2. Save to library
      const libRes  = await fetch("/api/admin/library", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, url: uploadData.url, file_type: fileType, file_size: uploadData.size ?? file.size, original_name: uploadData.name ?? file.name }),
      });
      const libData = await libRes.json() as { file?: LibraryFile };
      if (libData.file) setLibrary((p) => [libData.file!, ...p]);

      // 3. Link to lesson
      const lesRes  = await fetch(`/api/admin/lessons/${lessonId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, url: uploadData.url, file_type: fileType }),
      });
      const lesData = await lesRes.json() as { file?: ContentLessonFile };
      if (lesData.file) setLesFiles((p) => ({ ...p, [lessonId]: [...(p[lessonId] ?? []), lesData.file!] }));
    } finally { setLesUploading(false); }
  }

  // ── Existing handlers ──

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) {
      setLoadingLes(true);
      try {
        const res  = await fetch(`/api/admin/lessons?module_id=${mod.id}`);
        const data = await res.json() as { lessons?: ContentLesson[] };
        setLessons(data.lessons ?? []);
        setLoaded(true);
      } finally { setLoadingLes(false); }
    }
  }

  async function handleStatusCycle() {
    const next: ModuleStatus = mod.status === "active" ? "hidden" : mod.status === "hidden" ? "blocked" : "active";
    const res = await fetch(`/api/admin/modules/${mod.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) onUpdate({ ...mod, status: next });
  }

  async function handleSaveMod(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    setModSaving(true); setModErr("");
    try {
      const res  = await fetch(`/api/admin/modules/${mod.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, description: editForm.description || null, thumbnail_url: editForm.thumbnail_url || null }),
      });
      const data = await res.json() as { error?: string; module?: ContentModule };
      if (!res.ok) { setModErr(data.error ?? "Erro"); return; }
      onUpdate({ ...mod, ...(data.module ?? editForm) });
      setEditingMod(false);
    } finally { setModSaving(false); }
  }

  async function handleDeleteMod() {
    setModSaving(true);
    try {
      await fetch(`/api/admin/modules/${mod.id}`, { method: "DELETE" });
      onDelete(mod.id);
    } finally { setModSaving(false); }
  }

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.title.trim()) return;
    setLesSaving(true);
    try {
      const res  = await fetch("/api/admin/lessons", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, module_id: mod.id, description: addForm.description || null, video_url: addForm.video_url || null, thumbnail_url: addForm.thumbnail_url || null, duration_minutes: addForm.duration_minutes ? parseInt(addForm.duration_minutes) : null }),
      });
      const data = await res.json() as { lesson?: ContentLesson };
      if (data.lesson) {
        setLessons((p) => [...p, data.lesson!]);
        onUpdate({ ...mod, lesson_count: mod.lesson_count + 1 });
        setAddForm(EMPTY_LES);
        setShowAddLes(false);
        // Open edit form immediately so user can add materials
        setEditLesId(data.lesson.id);
        setEditLesForm(lesToForm(data.lesson));
        setLibSearch("");
        setLesFiles((p) => ({ ...p, [data.lesson!.id]: [] }));
        loadLibrary();
      }
    } finally { setLesSaving(false); }
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editLesForm.title.trim() || editLesId === null) return;
    setLesSaving(true);
    try {
      const res  = await fetch(`/api/admin/lessons/${editLesId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editLesForm, description: editLesForm.description || null, video_url: editLesForm.video_url || null, thumbnail_url: editLesForm.thumbnail_url || null, duration_minutes: editLesForm.duration_minutes ? parseInt(editLesForm.duration_minutes) : null }),
      });
      const data = await res.json() as { lesson?: ContentLesson };
      setLessons((p) => p.map((l) => l.id === editLesId ? (data.lesson ?? l) : l));
      setEditLesId(null);
    } finally { setLesSaving(false); }
  }

  async function handleDeleteLesson(id: number) {
    setLesSaving(true);
    try {
      await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
      setLessons((p) => p.filter((l) => l.id !== id));
      onUpdate({ ...mod, lesson_count: Math.max(0, mod.lesson_count - 1) });
      setDelLesId(null);
    } finally { setLesSaving(false); }
  }

  async function handleLessonStatusCycle(lesson: ContentLesson) {
    const next: LessonStatus = lesson.status === "published" ? "hidden" : lesson.status === "hidden" ? "draft" : "published";
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setLessons((p) => p.map((l) => l.id === lesson.id ? { ...l, status: next } : l));
  }

  function handleLesDragStart(e: React.DragEvent, i: number) { lesDragIdx.current = i; e.dataTransfer.effectAllowed = "move"; }
  function handleLesDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setLesOverIdx(i); }
  async function handleLesDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault();
    const from = lesDragIdx.current; lesDragIdx.current = null; setLesOverIdx(null);
    if (from === null || from === dropIdx) return;
    const reordered = [...lessons];
    const moved = reordered.splice(from, 1)[0]!;
    reordered.splice(dropIdx, 0, moved);
    setLessons(reordered);
    await fetch("/api/admin/lessons/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((l) => l.id) }),
    });
  }

  const ModStatusIcon = mod.status === "active" ? Eye : mod.status === "hidden" ? EyeOff : Lock;

  // Derived for the currently-editing lesson's materials
  const currentFiles = editLesId !== null ? (lesFiles[editLesId] ?? []) : [];
  const attachedUrls = new Set(currentFiles.map((f) => f.url));
  const filteredLib  = library
    .filter((f) => !attachedUrls.has(f.url))
    .filter((f) => f.name.toLowerCase().includes(libSearch.toLowerCase()));

  return (
    <div>
      {isDropTarget && <div className="h-0.5 bg-text/30 rounded mb-2" />}

      <div
        className={`border border-border rounded-xl bg-card transition-opacity ${isDragging ? "opacity-40" : ""}`}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
      >
        {/* ── Module header ── */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: mod.accent_color }} />

          <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnd={onDragEnd}
            className="cursor-grab flex-shrink-0 text-text-muted/40 hover:text-text-muted transition-colors touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {mod.thumbnail_url ? (
            <img src={mod.thumbnail_url} alt="" className="h-10 w-16 object-cover rounded-md flex-shrink-0" />
          ) : (
            <div className="h-10 w-16 rounded-md flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${mod.accent_color}20` }}>
              <PlayCircle className="h-4 w-4" style={{ color: mod.accent_color }} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{mod.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${MOD_CLASS[mod.status]}`}>
                {MOD_LABEL[mod.status]}
              </span>
              <span className="text-[10px] text-text-muted border border-border rounded-full px-1.5 py-0.5">
                {mod.lesson_count} {mod.lesson_count === 1 ? "aula" : "aulas"}
              </span>
            </div>
            {mod.description && <p className="text-xs text-text-muted mt-0.5 truncate">{mod.description}</p>}
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={handleStatusCycle} title={`Status: ${MOD_LABEL[mod.status]}`} className="p-2 rounded-lg hover:bg-text/5 text-text-muted hover:text-text transition-colors">
              <ModStatusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setEditForm(modToForm(mod)); setEditingMod(!editingMod); }}
              title="Editar módulo"
              className={`p-2 rounded-lg hover:bg-text/5 transition-colors ${editingMod ? "text-text" : "text-text-muted hover:text-text"}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDelModConfirm(true)} title="Excluir módulo" className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={handleExpand} title={expanded ? "Recolher" : "Expandir aulas"} className="p-2 rounded-lg hover:bg-text/5 text-text-muted hover:text-text transition-colors">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* ── Inline module edit form ── */}
        {editingMod && (
          <form onSubmit={handleSaveMod} className="border-t border-border px-4 py-4 space-y-3">
            {modErr && <p className="text-xs text-red-400">{modErr}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Título *</label>
                <input className={INPUT} value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Status</label>
                <select className={SELECT} value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as ModuleStatus }))}>
                  <option value="active">Ativo</option>
                  <option value="hidden">Oculto</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-text-muted">Descrição</label>
                <input className={INPUT} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Capa do módulo</label>
                <MediaUpload
                  value={editForm.thumbnail_url || null}
                  onChange={(url) => setEditForm((p) => ({ ...p, thumbnail_url: url ?? "" }))}
                  folder="modules"
                  aspect="thumbnail"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Cor de destaque</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={editForm.accent_color} onChange={(e) => setEditForm((p) => ({ ...p, accent_color: e.target.value }))} className="h-9 w-14 rounded border border-border cursor-pointer bg-bg" />
                  <input className={INPUT} value={editForm.accent_color} onChange={(e) => setEditForm((p) => ({ ...p, accent_color: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={modSaving} className={BTN_PRI}>{modSaving ? "Salvando…" : "Salvar"}</button>
              <button type="button" onClick={() => setEditingMod(false)} className={BTN_GHOST}>Cancelar</button>
            </div>
          </form>
        )}

        {/* ── Lessons area ── */}
        {expanded && (
          <div className="border-t border-border">
            {loadingLes ? (
              <div className="flex items-center justify-center gap-2 py-8 text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando aulas…</span>
              </div>
            ) : (
              <div className="px-4 py-4 space-y-2">

                {/* Add lesson trigger / form */}
                {showAddLes ? (
                  <form onSubmit={handleAddLesson} className="border border-border rounded-lg p-3 space-y-3 bg-bg mb-3">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Nova aula</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Título *</label>
                        <input className={INPUT} value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Introdução ao módulo" autoFocus />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Status</label>
                        <select className={SELECT} value={addForm.status} onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value as LessonStatus }))}>
                          <option value="published">Publicada</option>
                          <option value="draft">Rascunho</option>
                          <option value="hidden">Oculta</option>
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-text-muted">Descrição</label>
                        <input className={INPUT} value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} placeholder="Breve descrição" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">URL do vídeo</label>
                        <input className={INPUT} value={addForm.video_url} onChange={(e) => setAddForm((p) => ({ ...p, video_url: e.target.value }))} placeholder="https://vimeo.com/…" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">URL da thumbnail</label>
                        <input className={INPUT} value={addForm.thumbnail_url} onChange={(e) => setAddForm((p) => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://…" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Duração (min)</label>
                        <input className={INPUT} type="number" min="1" value={addForm.duration_minutes} onChange={(e) => setAddForm((p) => ({ ...p, duration_minutes: e.target.value }))} placeholder="Ex: 15" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={lesSaving} className={BTN_PRI}>{lesSaving ? "Adicionando…" : "Adicionar aula"}</button>
                      <button type="button" onClick={() => { setShowAddLes(false); setAddForm(EMPTY_LES); }} className={BTN_GHOST}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddLes(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:text-text hover:border-text/30 transition-colors w-full mb-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nova aula
                  </button>
                )}

                {/* Empty state */}
                {lessons.length === 0 && !showAddLes && (
                  <p className="text-xs text-text-muted text-center py-6">Nenhuma aula ainda. Clique em "Nova aula" para começar.</p>
                )}

                {/* Lessons list */}
                <div className="space-y-1">
                  {lessons.map((lesson, li) => {
                    const LesIcon   = lesson.status === "published" ? Eye : lesson.status === "hidden" ? EyeOff : Lock;
                    const fileCount = lesFiles[lesson.id]?.length ?? 0;
                    return (
                      <div key={lesson.id}>
                        {lesOverIdx === li && lesDragIdx.current !== null && lesDragIdx.current !== li && (
                          <div className="h-0.5 bg-text/30 rounded mb-1" />
                        )}

                        <div
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-bg border border-border/50 group transition-opacity ${lesDragIdx.current === li ? "opacity-40" : ""}`}
                          onDragOver={(e) => handleLesDragOver(e, li)}
                          onDrop={(e) => handleLesDrop(e, li)}
                        >
                          <div
                            draggable
                            onDragStart={(e) => handleLesDragStart(e, li)}
                            onDragEnd={() => { lesDragIdx.current = null; setLesOverIdx(null); }}
                            className="cursor-grab flex-shrink-0 text-text-muted/30 group-hover:text-text-muted/60 transition-colors touch-none"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>

                          {lesson.thumbnail_url ? (
                            <img src={lesson.thumbnail_url} alt="" className="h-8 w-12 object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="h-8 w-12 rounded bg-text/5 flex items-center justify-center flex-shrink-0">
                              {lesson.video_url
                                ? <PlayCircle className="h-3 w-3 text-text-muted/40" />
                                : <FileText className="h-3 w-3 text-text-muted/40" />
                              }
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium truncate">{lesson.title}</span>
                              <span className={`text-[10px] px-1 py-0.5 rounded-full border ${LES_CLASS[lesson.status]}`}>
                                {LES_LABEL[lesson.status]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.video_url && <span className="text-[10px] text-text-muted flex items-center gap-0.5"><PlayCircle className="h-2.5 w-2.5" /> Vídeo</span>}
                              {lesson.duration_minutes && <span className="text-[10px] text-text-muted flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {lesson.duration_minutes}min</span>}
                              {fileCount > 0 && (
                                <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                  <Paperclip className="h-2.5 w-2.5" /> {fileCount} {fileCount === 1 ? "material" : "materiais"}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button onClick={() => handleLessonStatusCycle(lesson)} title={`Status: ${LES_LABEL[lesson.status]}`} className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors">
                              <LesIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditLesId(lesson.id);
                                setEditLesForm(lesToForm(lesson));
                                setLibSearch("");
                                loadLessonFiles(lesson.id);
                                loadLibrary();
                              }}
                              className={`p-1.5 rounded hover:bg-text/5 transition-colors ${editLesId === lesson.id ? "text-text" : "text-text-muted hover:text-text"}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDelLesId(lesson.id)} className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline edit lesson */}
                        {editLesId === lesson.id && (
                          <form onSubmit={handleSaveLesson} className="mt-1 border border-border rounded-lg p-3 space-y-3 bg-bg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs text-text-muted">Título *</label>
                                <input className={INPUT} value={editLesForm.title} onChange={(e) => setEditLesForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-text-muted">Status</label>
                                <select className={SELECT} value={editLesForm.status} onChange={(e) => setEditLesForm((p) => ({ ...p, status: e.target.value as LessonStatus }))}>
                                  <option value="published">Publicada</option>
                                  <option value="draft">Rascunho</option>
                                  <option value="hidden">Oculta</option>
                                </select>
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-xs text-text-muted">Descrição</label>
                                <input className={INPUT} value={editLesForm.description} onChange={(e) => setEditLesForm((p) => ({ ...p, description: e.target.value }))} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-text-muted">URL do vídeo</label>
                                <input className={INPUT} value={editLesForm.video_url} onChange={(e) => setEditLesForm((p) => ({ ...p, video_url: e.target.value }))} placeholder="https://vimeo.com/…" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-text-muted">URL da thumbnail</label>
                                <input className={INPUT} value={editLesForm.thumbnail_url} onChange={(e) => setEditLesForm((p) => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://…" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-text-muted">Duração (min)</label>
                                <input className={INPUT} type="number" min="1" value={editLesForm.duration_minutes} onChange={(e) => setEditLesForm((p) => ({ ...p, duration_minutes: e.target.value }))} />
                              </div>
                            </div>

                            {/* ── Materials section ── */}
                            <div className="border-t border-border pt-3 space-y-2">
                              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                                Materiais da aula{currentFiles.length > 0 ? ` · ${currentFiles.length}` : ""}
                              </p>

                              {/* Attached files */}
                              {currentFiles.map((f) => (
                                <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-card border border-border">
                                  <Paperclip className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
                                  <span className="text-xs flex-1 truncate">{f.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterial(lesson.id, f.id)}
                                    className="p-0.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
                                    title="Remover material"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Upload new file directly */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={lesUploading}
                                  onClick={() => lesUploadRef.current?.click()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md text-text-muted hover:text-text hover:border-text/30 transition-colors disabled:opacity-50"
                                >
                                  {lesUploading
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Upload className="h-3 w-3" />
                                  }
                                  {lesUploading ? "Enviando…" : "Subir novo arquivo"}
                                </button>
                                {lesUploadErr && <span className="text-xs text-red-400">{lesUploadErr}</span>}
                              </div>

                              {/* Library picker */}
                              <div className="border border-dashed border-border rounded-lg overflow-hidden">
                                <div className="px-2.5 py-2 border-b border-border/50 flex items-center gap-2">
                                  <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide flex-1">Da biblioteca</p>
                                  {libLoading && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
                                </div>
                                {library.length === 0 && !libLoading ? (
                                  <p className="text-[10px] text-text-muted text-center py-4 px-2">
                                    Biblioteca vazia — use "Subir novo arquivo" ou adicione na aba Biblioteca
                                  </p>
                                ) : (
                                  <div className="p-2 space-y-1.5">
                                    <input
                                      type="text"
                                      placeholder="Filtrar…"
                                      value={libSearch}
                                      onChange={(e) => setLibSearch(e.target.value)}
                                      className="w-full rounded border border-border bg-bg px-2 py-1 text-xs focus:outline-none focus:border-text-muted transition-colors"
                                    />
                                    <div className="max-h-44 overflow-y-auto space-y-0.5">
                                      {filteredLib.map((f) => (
                                        <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-text/5 group">
                                          <FileText className="h-3 w-3 text-text-muted flex-shrink-0" />
                                          <span className="text-xs flex-1 truncate text-text-muted group-hover:text-text">{f.name}</span>
                                          {f.file_size != null && (
                                            <span className="text-[10px] text-text-muted/50 flex-shrink-0">{formatBytes(f.file_size)}</span>
                                          )}
                                          <button
                                            type="button"
                                            disabled={matAdding === f.id}
                                            onClick={() => handleAddMaterial(lesson.id, f)}
                                            className="px-2 py-0.5 text-[10px] bg-text text-bg rounded hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                                          >
                                            {matAdding === f.id ? "…" : "Vincular"}
                                          </button>
                                        </div>
                                      ))}
                                      {filteredLib.length === 0 && library.length > 0 && (
                                        <p className="text-[10px] text-text-muted text-center py-3">
                                          {library.filter((f) => !attachedUrls.has(f.url)).length === 0
                                            ? "Todos os arquivos já vinculados"
                                            : "Nenhum arquivo encontrado"
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Hidden file input for lesson upload */}
                              <input
                                ref={lesUploadRef}
                                type="file"
                                accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f && editLesId !== null) handleLessonUpload(editLesId, f);
                                  e.target.value = "";
                                }}
                              />
                            </div>

                            <div className="flex gap-2">
                              <button type="submit" disabled={lesSaving} className={BTN_PRI}>{lesSaving ? "Salvando…" : "Salvar"}</button>
                              <button type="button" onClick={() => setEditLesId(null)} className={BTN_GHOST}>Cancelar</button>
                            </div>
                          </form>
                        )}

                        {/* Delete lesson confirm */}
                        {delLesId === lesson.id && (
                          <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-lg px-3 py-2.5 flex items-center gap-3">
                            <p className="text-xs flex-1">Remover <strong>{lesson.title}</strong>?</p>
                            <button onClick={() => handleDeleteLesson(lesson.id)} disabled={lesSaving} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50">Remover</button>
                            <button onClick={() => setDelLesId(null)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5">Cancelar</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {lessons.length > 0 && (
                  <p className="text-xs text-text-muted pt-1">{lessons.length} {lessons.length === 1 ? "aula" : "aulas"}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete module confirm */}
      {delModConfirm && (
        <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-xl px-4 py-3 flex items-center gap-3">
          <p className="text-sm flex-1">Excluir <strong>{mod.title}</strong>? Todas as aulas serão removidas.</p>
          <button onClick={handleDeleteMod} disabled={modSaving} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50">Excluir</button>
          <button onClick={() => setDelModConfirm(false)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5">Cancelar</button>
        </div>
      )}
    </div>
  );
}

// ─── ModulesManager ───────────────────────────────────────────────────────────

interface Props { initialModules: ContentModule[]; }

export function ModulesManager({ initialModules }: Props) {
  const [modules,    setModules]    = useState(initialModules);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState<ModuleForm>(EMPTY_MOD);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");

  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const f = (patch: Partial<ModuleForm>) => setForm((p) => ({ ...p, ...patch }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Título é obrigatório"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/admin/modules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null, thumbnail_url: form.thumbnail_url || null }),
      });
      const data = await res.json() as { error?: string; module?: ContentModule };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      if (data.module) setModules((p) => [...p, data.module!]);
      setForm(EMPTY_MOD); setShowCreate(false);
    } finally { setSaving(false); }
  }

  function handleDragStart(e: React.DragEvent, i: number) { dragIdx.current = i; e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e: React.DragEvent, i: number)  { e.preventDefault(); setOverIdx(i); }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragIdx.current; dragIdx.current = null; setOverIdx(null);
    if (from === null || from === dropIndex) return;
    const reordered = [...modules];
    const moved = reordered.splice(from, 1)[0]!;
    reordered.splice(dropIndex, 0, moved);
    setModules(reordered);
    await fetch("/api/admin/modules/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((m) => m.id) }),
    });
  }

  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{err}</p>}

      {showCreate ? (
        <form onSubmit={handleCreate} className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <h3 className="font-medium text-sm">Novo módulo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Título *</label>
              <input className={INPUT} value={form.title} onChange={(e) => f({ title: e.target.value })} placeholder="Ex: Manejo Sanitário" autoFocus />
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
              <label className="text-xs text-text-muted">Capa do módulo</label>
              <MediaUpload
                value={form.thumbnail_url || null}
                onChange={(url) => f({ thumbnail_url: url ?? "" })}
                folder="modules"
                aspect="thumbnail"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Cor de destaque</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.accent_color} onChange={(e) => f({ accent_color: e.target.value })} className="h-9 w-14 rounded border border-border cursor-pointer bg-bg" />
                <input className={INPUT} value={form.accent_color} onChange={(e) => f({ accent_color: e.target.value })} placeholder="#5FAF3E" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className={BTN_PRI}>{saving ? "Criando…" : "Criar módulo"}</button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_MOD); setErr(""); }} className={BTN_GHOST}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl text-sm text-text-muted hover:text-text hover:border-text/30 transition-colors w-full"
        >
          <Plus className="h-4 w-4" /> Novo módulo
        </button>
      )}

      {modules.length === 0 && !showCreate && (
        <p className="text-text-muted text-sm py-10 text-center">Nenhum módulo criado ainda.</p>
      )}

      <div className="space-y-2">
        {modules.map((mod, index) => (
          <ModuleAccordionItem
            key={mod.id}
            mod={mod}
            index={index}
            onUpdate={(updated) => setModules((p) => p.map((m) => m.id === updated.id ? updated : m))}
            onDelete={(id) => setModules((p) => p.filter((m) => m.id !== id))}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={() => { dragIdx.current = null; setOverIdx(null); }}
            isDragging={dragIdx.current === index}
            isDropTarget={overIdx === index && dragIdx.current !== null && dragIdx.current !== index}
          />
        ))}
      </div>
    </div>
  );
}
