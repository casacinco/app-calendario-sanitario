"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublishButton({ calendarId }: { calendarId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePublish() {
    if (!confirm("Publicar este calendário? O aluno poderá visualizá-lo.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/calendars/${calendarId}/publish`, {
        method: "POST",
      });
      const data = await res.json<{ calendar?: unknown; error?: string }>();
      if (!res.ok) throw new Error(data.error ?? "Erro ao publicar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handlePublish} disabled={loading}>
        <Send className="h-4 w-4" />
        {loading ? "Publicando…" : "Publicar calendário"}
      </Button>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
