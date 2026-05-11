"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
const ACCEPT_LABEL = "JPG, PNG ou WEBP · máx. 5 MB";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  /** "thumbnail" = 16:9 compacto | "banner" = 21:9 largo */
  aspect?: "thumbnail" | "banner";
}

export function MediaUpload({ value, onChange, folder = "uploads", aspect = "thumbnail" }: Props) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [dragOver,  setDragOver]  = useState(false);

  async function upload(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",   file);
      fd.append("folder", folder);

      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao fazer upload");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    upload(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const aspectClass = aspect === "banner"
    ? "aspect-[21/6]"
    : "aspect-[16/9]";

  return (
    <div className="space-y-1.5">
      <div
        className={`relative rounded-lg border-2 transition-colors overflow-hidden ${aspectClass} ${
          dragOver
            ? "border-text/40 bg-text/5"
            : value
              ? "border-border"
              : "border-dashed border-border hover:border-text/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {value ? (
          /* Preview */
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-black text-xs font-medium rounded-md hover:bg-white transition-colors"
              >
                <Upload className="h-3.5 w-3.5" /> Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 text-white text-xs font-medium rounded-md hover:bg-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          </>
        ) : uploading ? (
          /* Uploading */
          <button
            type="button"
            disabled
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted cursor-default"
          >
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Enviando…</span>
          </button>
        ) : (
          /* Drop zone */
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs text-center px-4">
              Arraste aqui ou <span className="underline underline-offset-2">clique para selecionar</span>
            </span>
          </button>
        )}

        {/* Drag overlay */}
        {dragOver && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-text/10 border-2 border-text/40 rounded-lg pointer-events-none">
            <span className="text-sm font-medium">Solte aqui</span>
          </div>
        )}
      </div>

      {/* Format hint */}
      {!value && !uploading && (
        <p className="text-[10px] text-text-muted">{ACCEPT_LABEL}</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X className="h-3 w-3 flex-shrink-0" /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
