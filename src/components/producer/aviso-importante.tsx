"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

type ChecklistKey = "clostridiose" | "pasteurelose" | "vermifugo" | "suplementacao";
type ChecklistVal = "done" | "pending" | null;

const ITEMS: { key: ChecklistKey; label: string; sub: string }[] = [
  { key: "clostridiose",  label: "Clostridiose",            sub: "Dose + Reforço" },
  { key: "pasteurelose",  label: "Pasteurelose",            sub: "Dose + Reforço" },
  { key: "vermifugo",     label: "Vermífugo",               sub: "Dose + Reforço" },
  { key: "suplementacao", label: "Suplementação (Catofós)", sub: "Dose" },
];

const URGENTES = [
  "Clostridiose — DOSE + REFORÇO",
  "Pasteurelose — DOSE + REFORÇO",
  "Vermífugo — DOSE + REFORÇO",
  "Suplementação — DOSE (Catofós)",
];

export function AvisoImportante() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [checklist, setChecklist] = useState<Record<ChecklistKey, ChecklistVal>>({
    clostridiose:  null,
    pasteurelose:  null,
    vermifugo:     null,
    suplementacao: null,
  });
  const [loading, setLoading] = useState(false);

  const allAnswered = ITEMS.every((i) => checklist[i.key] !== null);

  function mark(key: ChecklistKey, val: ChecklistVal) {
    setChecklist((prev) => ({ ...prev, [key]: val }));
  }

  async function handleConfirm() {
    setLoading(true);
    await fetch("/api/dashboard/calendar/intro-confirmed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist }),
    });
    setLoading(false);
    router.refresh();
  }

  // ── Etapa 0: aviso ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-200 bg-amber-50">
        <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            Importante — leia antes de utilizar o calendário
          </p>
        </div>

        <div className="px-4 py-4 space-y-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            Este calendário sanitário foi elaborado exclusivamente para o seu rebanho,
            considerando suas condições específicas de criação, região e histórico sanitário.
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">
            Caso o rebanho ainda não utilize nenhum calendário sanitário e{" "}
            <strong>não tenha sido realizada vacinação contra clostridiose e pasteurelose
            nos últimos 3 meses</strong>, siga imediatamente a recomendação abaixo em
            todos os animais com idade acima de 3 meses.
          </p>

          <div className="bg-amber-100 rounded-xl px-3 py-3 space-y-2">
            {URGENTES.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-900">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Li e compreendi
          </button>
        </div>
      </div>
    );
  }

  // ── Etapa 1: checklist ────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-200 bg-amber-50">
      <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
          Ação imediata recomendada
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        <p className="text-sm font-semibold text-amber-800">
          Esses manejos já foram realizados nos últimos 3 meses?
        </p>

        <div className="space-y-2.5">
          {ITEMS.map((item) => {
            const val = checklist[item.key];
            return (
              <div key={item.key} className="bg-white rounded-xl px-3 py-3 border border-amber-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => mark(item.key, "done")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        val === "done"
                          ? "bg-[#16A34A] text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      Já realizei
                    </button>
                    <button
                      onClick={() => mark(item.key, "pending")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        val === "pending"
                          ? "bg-[#CC0000] text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      NÃO realizei
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!allAnswered || loading}
          className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading ? "Salvando..." : "Confirmar situação sanitária"}
        </button>
      </div>
    </div>
  );
}
