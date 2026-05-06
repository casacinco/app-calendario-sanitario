"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublishButtonProps {
  calendarId: number;
  status: "draft" | "published";
}

export function PublishButton({ calendarId, status }: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePublish() {
    if (!confirm("Publicar este calendário? O aluno poderá visualizá-lo.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/calendars/${calendarId}/publish`, { method: "POST" });
      const data = await res.json<{ calendar?: unknown; error?: string }>();
      if (!res.ok) throw new Error(data.error ?? "Erro ao publicar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(false);
    }
  }

  async function handleUnpublish() {
    if (
      !confirm(
        "Tem certeza que deseja cancelar a publicação deste calendário? Ele deixará de aparecer como entregue para o criador.",
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/calendars/${calendarId}/unpublish`, { method: "POST" });
      const data = await res.json<{ calendar?: unknown; error?: string }>();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cancelar publicação");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {status === "draft" ? (
        <Button onClick={handlePublish} disabled={loading}>
          <Send className="h-4 w-4" />
          {loading ? "Publicando…" : "Publicar calendário"}
        </Button>
      ) : (
        <Button variant="outline" onClick={handleUnpublish} disabled={loading}>
          <X className="h-4 w-4" />
          {loading ? "Cancelando…" : "Cancelar publicação"}
        </Button>
      )}
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
