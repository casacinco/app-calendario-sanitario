"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight, Image } from "lucide-react";
import type { Banner } from "@/lib/db";

const INPUT = "w-full rounded-md border border-border bg-background text-text px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-text/30";
const TEXTAREA = "w-full rounded-md border border-border bg-background text-text px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-text/30 resize-none";

interface BannerForm {
  title: string; description: string; image_url: string;
  button_label: string; button_link: string; is_active: boolean;
}
const EMPTY: BannerForm = { title: "", description: "", image_url: "", button_label: "", button_link: "", is_active: true };

function formFromBanner(b: Banner): BannerForm {
  return { title: b.title, description: b.description ?? "", image_url: b.image_url ?? "", button_label: b.button_label ?? "", button_link: b.button_link ?? "", is_active: b.is_active === 1 };
}

interface Props { initialBanners: Banner[]; }

export function BannersManager({ initialBanners }: Props) {
  const [banners, setBanners] = useState(initialBanners);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<BannerForm>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BannerForm>(EMPTY);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const f = (patch: Partial<BannerForm>) => setForm((p) => ({ ...p, ...patch }));
  const ef = (patch: Partial<BannerForm>) => setEditForm((p) => ({ ...p, ...patch }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Título é obrigatório"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null, image_url: form.image_url || null, button_label: form.button_label || null, button_link: form.button_link || null, is_active: form.is_active ? 1 : 0 }),
      });
      const data = await res.json() as { error?: string; banner?: Banner };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      if (data.banner) setBanners((prev) => [...prev, data.banner!]);
      setForm(EMPTY); setShowCreate(false);
    } finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.title.trim() || editId === null) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/admin/banners/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, description: editForm.description || null, image_url: editForm.image_url || null, button_label: editForm.button_label || null, button_link: editForm.button_link || null, is_active: editForm.is_active ? 1 : 0 }),
      });
      const data = await res.json() as { error?: string; banner?: Banner };
      if (!res.ok) { setErr(data.error ?? "Erro"); return; }
      setBanners((prev) => prev.map((b) => b.id === editId ? (data.banner ?? b) : b));
      setEditId(null);
    } finally { setSaving(false); }
  }

  async function toggleActive(banner: Banner) {
    const res = await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: banner.is_active === 1 ? 0 : 1 }),
    });
    const data = await res.json() as { banner?: Banner };
    if (res.ok) setBanners((prev) => prev.map((b) => b.id === banner.id ? (data.banner ?? b) : b));
  }

  async function handleDelete(id: number) {
    setSaving(true);
    try {
      await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  function handleDragStart(e: React.DragEvent, index: number) { dragIndex.current = index; e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e: React.DragEvent, index: number) { e.preventDefault(); setOverIndex(index); }
  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const from = dragIndex.current; dragIndex.current = null; setOverIndex(null);
    if (from === null || from === dropIndex) return;
    const reordered = [...banners];
    const moved = reordered.splice(from, 1)[0]!;
    reordered.splice(dropIndex, 0, moved);
    setBanners(reordered);
    await Promise.all(reordered.map((b, i) =>
      fetch(`/api/admin/banners/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: i }) })
    ));
  }

  function BannerFormFields({ values, onChange }: { values: BannerForm; onChange: (p: Partial<BannerForm>) => void }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-text-muted">Título *</label>
          <input className={INPUT} value={values.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Título do banner" />
        </div>
        <div className="space-y-1 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-text-muted">Status</label>
            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={() => onChange({ is_active: !values.is_active })} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
                {values.is_active ? <ToggleRight className="h-5 w-5 text-green" /> : <ToggleLeft className="h-5 w-5" />}
                {values.is_active ? "Ativo" : "Inativo"}
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-text-muted">Descrição</label>
          <textarea className={TEXTAREA} rows={2} value={values.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Texto do banner" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-text-muted">URL da imagem</label>
          <input className={INPUT} value={values.image_url} onChange={(e) => onChange({ image_url: e.target.value })} placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-text-muted">Texto do botão</label>
          <input className={INPUT} value={values.button_label} onChange={(e) => onChange({ button_label: e.target.value })} placeholder="Ex: Saiba mais" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-text-muted">Link do botão</label>
          <input className={INPUT} value={values.button_link} onChange={(e) => onChange({ button_link: e.target.value })} placeholder="https://..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{err}</p>}

      {showCreate ? (
        <form onSubmit={handleCreate} className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <h3 className="font-medium text-sm">Novo banner</h3>
          <BannerFormFields values={form} onChange={f} />
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">{saving ? "Salvando…" : "Criar banner"}</button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY); setErr(""); }} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">Cancelar</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-sm text-text-muted hover:text-text hover:border-text/30 transition-colors">
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      )}

      {banners.length === 0 && !showCreate && (
        <p className="text-text-muted text-sm py-8 text-center">Nenhum banner criado.</p>
      )}

      <div className="space-y-2">
        {banners.map((banner, index) => (
          <div key={banner.id}>
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
                <GripVertical className="h-4 w-4 text-text-muted cursor-grab flex-shrink-0" />
                {banner.image_url ? (
                  <img src={banner.image_url} alt="" className="h-12 w-20 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="h-12 w-20 rounded bg-text/5 flex items-center justify-center flex-shrink-0">
                    <Image className="h-5 w-5 text-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{banner.title}</span>
                    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${banner.is_active ? "bg-green/15 text-green border-green/30" : "bg-text-muted/10 text-text-muted border-border"}`}>
                      {banner.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {banner.description && <p className="text-xs text-text-muted mt-0.5 truncate">{banner.description}</p>}
                  {banner.button_label && <p className="text-xs text-text-muted mt-0.5">{banner.button_label} → {banner.button_link}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(banner)} title={banner.is_active ? "Desativar" : "Ativar"} className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors">
                    {banner.is_active ? <ToggleRight className="h-4 w-4 text-green" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditId(banner.id); setEditForm(formFromBanner(banner)); }} className="p-1.5 rounded hover:bg-text/5 text-text-muted hover:text-text transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(banner.id)} className="p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editId === banner.id && (
                <form onSubmit={handleEdit} className="border-t border-border p-4 space-y-3">
                  <BannerFormFields values={editForm} onChange={ef} />
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-text text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">{saving ? "Salvando…" : "Salvar"}</button>
                    <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-md">Cancelar</button>
                  </div>
                </form>
              )}
            </div>

            {deleteId === banner.id && (
              <div className="mt-1 border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 flex items-center gap-3">
                <p className="text-sm flex-1">Excluir banner <strong>{banner.title}</strong>?</p>
                <button onClick={() => handleDelete(banner.id)} disabled={saving} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50">Excluir</button>
                <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-xs border border-border rounded hover:bg-text/5">Cancelar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
