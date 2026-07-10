import Link from "next/link";
import type { EventCounts } from "@/lib/calendar-events";

type CentralManejoState = "producing" | "preview" | "active";

interface CentralDeManejoProps {
  state: CentralManejoState;
  /** Só relevante (pode ser null) no estado "preview". */
  counts: EventCounts | null;
}

const MONTHS_FULL = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

export function CentralDeManejo({ state, counts }: CentralDeManejoProps) {
  if (state === "producing") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm bg-white p-5 space-y-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Central de Manejo</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Sua Central de Manejo será liberada automaticamente quando seu calendário
          personalizado estiver pronto. Enquanto isso você já pode acessar todos os
          conteúdos exclusivos.
        </p>
        <button
          type="button"
          disabled
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed"
        >
          Em breve
        </button>
      </div>
    );
  }

  if (state === "active") {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <h2 className="text-base font-bold text-gray-900 leading-tight">Central de Manejo ativa</h2>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Seu calendário agora acompanha automaticamente a execução do manejo do seu rebanho.
        </p>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-300 italic">
            Em breve: ações do dia, manejos do mês e próximos manejos.
          </p>
        </div>
      </div>
    );
  }

  // state === "preview"
  const hasPending = !!counts && (counts.overdue > 0 || counts.thisMonth > 0 || counts.nextMonthIndex !== null);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="p-5 space-y-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Central de Manejo</p>
        <h2 className="text-base font-bold text-gray-900 leading-tight">
          Ative o acompanhamento automático
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Seu calendário agora pode acompanhar automaticamente a execução dos manejos.
        </p>
        <button
          type="button"
          disabled
          className="w-full py-3 rounded-xl bg-[#CC0000]/40 text-white/80 text-sm font-bold cursor-not-allowed"
        >
          Ativar a Central de Manejo
        </button>
      </div>

      {counts && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-1.5 bg-gray-50/60">
          {counts.overdue > 0 && (
            <p className="text-sm text-amber-700 font-medium">
              {plural(counts.overdue, "manejo")} atrasado{counts.overdue > 1 ? "s" : ""}
            </p>
          )}
          {counts.thisMonth > 0 && (
            <p className="text-sm text-gray-700 font-medium">
              {plural(counts.thisMonth, "manejo")} previsto{counts.thisMonth > 1 ? "s" : ""} para este mês
            </p>
          )}
          {counts.nextMonthIndex !== null && (
            <p className="text-sm text-gray-500">
              Próximo manejo em {MONTHS_FULL[counts.nextMonthIndex - 1]}
            </p>
          )}
          {!hasPending && (
            <p className="text-sm text-gray-400">Nenhum manejo pendente no momento.</p>
          )}
        </div>
      )}

      <div className="border-t border-gray-100 p-4">
        <Link
          href="/dashboard/calendario"
          className="block w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
        >
          Abrir Central de Manejo
        </Link>
      </div>
    </div>
  );
}
