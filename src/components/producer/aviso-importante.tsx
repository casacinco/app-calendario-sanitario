"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function AvisoImportante() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading,   setLoading]   = useState(false);

  if (confirmed) return null;

  async function handleConfirm() {
    setLoading(true);
    await fetch("/api/dashboard/calendar/intro-confirmed", { method: "POST" });
    setConfirmed(true);
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-200 bg-amber-50">
      <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
          Importante — leia antes de utilizar
        </p>
      </div>
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-amber-800 leading-relaxed">
          Este calendário sanitário foi elaborado exclusivamente para o seu rebanho,
          considerando suas condições específicas de criação, região e histórico sanitário.
          Leia todas as recomendações com atenção antes de executar qualquer manejo.
          Em caso de dúvidas, consulte um médico veterinário de confiança.
        </p>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-60 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading ? "Salvando..." : "Li e compreendi"}
        </button>
      </div>
    </div>
  );
}
