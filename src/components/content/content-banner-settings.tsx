"use client";

import { useState } from "react";
import { MediaUpload } from "@/components/content/media-upload";

interface Props {
  initialUrl: string | null;
}

export function ContentBannerSettings({ initialUrl }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave(newUrl: string | null) {
    setSaving(true); setErr(""); setSaved(false);
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <div>
        <h3 className="font-medium text-sm">Banner de conteúdos (Home do produtor)</h3>
        <p className="text-xs text-text-muted mt-0.5">
          Imagem exibida como destaque na home do produtor, com link para a área de conteúdos.
          Recomendado: 1920 × 550px. Se não houver imagem, um card padrão é exibido.
        </p>
      </div>

      {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{err}</p>}

      <MediaUpload
        value={url}
        onChange={(newUrl) => {
          setUrl(newUrl);
          handleSave(newUrl);
        }}
        folder="settings"
        aspect="banner"
      />

      {saving && <p className="text-xs text-text-muted">Salvando…</p>}
      {saved && <p className="text-xs text-green-500">Salvo com sucesso.</p>}
    </div>
  );
}
