"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateCalendarButton({ requestId }: { requestId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      const data = await res.json<{
        calendar?: { id: number };
        error?: string;
      }>();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar calendário");
      router.push(`/admin/calendarios/${data.calendar!.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Criando…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" /> Criar calendário
          </>
        )}
      </Button>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
