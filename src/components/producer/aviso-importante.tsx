"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2 } from "lucide-react";

type ChecklistKey = "clostridiose" | "pasteurelose" | "vermifugo" | "suplementacao";
type ChecklistVal = "done" | "pending" | null;

const ITEMS: {
  key:        ChecklistKey;
  label:      string;
  indication: string;
  sub:        string;
}[] = [
  { key: "clostridiose",  label: "Vacina contra Clostridiose",  indication: "DOSE + REFORÇO", sub: "Vacinação" },
  { key: "pasteurelose",  label: "Vacina contra Pasteurelose",  indication: "DOSE + REFORÇO", sub: "Vacinação" },
  { key: "vermifugo",     label: "Manejo de Vermifugação",      indication: "DOSE + REFORÇO", sub: "Vermifugação" },
  { key: "suplementacao", label: "Manejo de Suplementação",     indication: "DOSE (Catofós)", sub: "Suplementação" },
];

export function OnboardingSanitario() {
  const router = useRouter();
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

  return (
    <div className="py-4 space-y-6">

      {/* ── Cabeçalho ── */}
      <div className="text-center space-y-4 px-2">
        <div className="w-12 h-12 rounded-2xl bg-[#CC0000]/10 flex items-center justify-center mx-auto">
          <CalendarDays className="h-6 w-6 text-[#CC0000]" />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#CC0000] uppercase tracking-widest">
            Configuração inicial
          </p>
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            Ativação do calendário sanitário
          </h1>
        </div>

        <div className="space-y-2 text-sm max-w-md mx-auto">
          <p className="text-gray-400 leading-relaxed">
            Seu calendário foi elaborado considerando as características específicas do seu
            rebanho, região e sistema de manejo.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Antes de liberar seu calendário sanitário,{" "}
            <span className="font-semibold text-gray-900">
              valide a situação sanitária atual dos seus animais
            </span>{" "}
            respondendo abaixo.
          </p>
        </div>
      </div>

      {/* ── Contexto ── */}
      <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 space-y-2.5">
        <p className="text-sm font-bold text-gray-900">
          Por que isso é importante?
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Se algum manejo preventivo{" "}
          <span className="font-semibold text-gray-900">não foi realizado nos últimos 3 meses</span>,
          os itens marcados como{" "}
          <span className="font-semibold text-[#CC0000]">ainda não realizado</span>{" "}
          serão adicionados automaticamente como{" "}
          <span className="font-semibold text-gray-900">ação imediata</span>{" "}
          no seu calendário — para todos os animais acima de 3 meses.
        </p>
      </div>

      {/* ── Checklist ── */}
      <div className="space-y-3">
        {ITEMS.map((item) => {
          const val = checklist[item.key];
          return (
            <div
              key={item.key}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Item header */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {item.indication}
                  </span>
                </div>
              </div>

              {/* Radio options */}
              <div>
                {/* Opção: Já realizado */}
                <button
                  onClick={() => mark(item.key, "done")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-50 ${
                    val === "done" ? "bg-[#F0FDF4]" : "hover:bg-gray-50/70"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      val === "done" ? "border-[#16A34A] bg-[#16A34A]" : "border-gray-300"
                    }`}
                  >
                    {val === "done" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      val === "done"
                        ? "font-semibold text-[#15803D]"
                        : "text-gray-600"
                    }`}
                  >
                    Já realizado nos últimos 3 meses
                  </span>
                  {val === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] ml-auto flex-shrink-0" />
                  )}
                </button>

                {/* Opção: Ainda não realizado */}
                <button
                  onClick={() => mark(item.key, "pending")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    val === "pending" ? "bg-[#FEF2F2]" : "hover:bg-gray-50/70"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      val === "pending" ? "border-[#DC2626] bg-[#DC2626]" : "border-gray-300"
                    }`}
                  >
                    {val === "pending" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      val === "pending"
                        ? "font-semibold text-[#DC2626]"
                        : "text-gray-600"
                    }`}
                  >
                    Ainda não realizado
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Botão confirmar ── */}
      <button
        onClick={handleConfirm}
        disabled={!allAnswered || loading}
        className="w-full py-4 rounded-2xl bg-[#CC0000] text-white text-sm font-bold tracking-wide hover:bg-[#AA0000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading ? "Salvando..." : "CONFIRMAR SITUAÇÃO SANITÁRIA"}
      </button>

      {!allAnswered && (
        <p className="text-center text-xs text-gray-400">
          Responda todos os itens para continuar
        </p>
      )}
    </div>
  );
}
