"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface Props {
  initialUrl: string | null;
}

export function ContentBannerSettings({ initialUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function save(newUrl: string | null) {
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "content_home_banner_url", value: newUrl }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setErr(data.error ?? "Erro ao salvar"); return; }
      setUrl(newUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErr("Falha na conexão");
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setErr(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "settings");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) { setErr(data.error ?? "Erro no upload"); return; }
      await save(data.url);
    } catch {
      setErr("Falha na conexão");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div
          className="relative flex-shrink-0 w-32 h-[72px] rounded-md overflow-hidden border border-border bg-text/5 cursor-pointer group"
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {url ? (
            <>
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </>
          ) : uploading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted group-hover:text-text transition-colors">
              <ImageIcon className="h-5 w-5" />
              <span className="text-[10px]">Clique para enviar</span>
            </div>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Banner de conteúdos</p>
          <p className="text-xs text-text-muted mt-0.5">
            Exibido na home do produtor com link para /conteudos · 1280 × 720px · JPG ou PNG
          </p>
          {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
          {saved && <p className="text-xs text-green-500 mt-1">Salvo.</p>}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-text/5 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3 w-3" />
            {url ? "Trocar" : "Enviar"}
          </button>
          {url && (
            <button
              type="button"
              onClick={() => save(null)}
              className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
              title="Remover imagem"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}
