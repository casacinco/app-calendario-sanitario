import { ClipboardCheck, Bell, CalendarClock, Calculator, History, FileCheck2 } from "lucide-react";

type CentralManejoState = "producing" | "preview" | "active";

interface CentralDeManejoProps {
  state: CentralManejoState;
}

const BENEFITS = [
  { icon: Bell,          label: "Lembretes automáticos" },
  { icon: CalendarClock, label: "Organização automática dos manejos" },
  { icon: Calculator,    label: "Calculadora de doses" },
  { icon: History,       label: "Histórico completo dos manejos" },
  { icon: FileCheck2,    label: "Protocolos sanitários complementares" },
];

const CARD = "rounded-3xl overflow-hidden shadow-lg bg-[#111111]";

export function CentralDeManejo({ state }: CentralDeManejoProps) {
  if (state === "producing") {
    return (
      <div className={`${CARD} p-6 space-y-4`}>
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Central de Manejo</p>
        <p className="text-sm text-white/55 leading-relaxed">
          Sua Central de Manejo será liberada automaticamente quando seu calendário
          personalizado estiver pronto. Enquanto isso você já pode acessar todos os
          conteúdos exclusivos.
        </p>
        <button
          type="button"
          disabled
          className="w-full py-3.5 rounded-2xl bg-white/5 text-white/30 text-sm font-bold cursor-not-allowed"
        >
          Em breve
        </button>
      </div>
    );
  }

  if (state === "active") {
    return (
      <div className={`${CARD} p-6 space-y-4`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <h2 className="text-base font-bold text-white leading-tight">Central de Manejo ativa</h2>
        </div>
        <p className="text-sm text-white/55 leading-relaxed">
          Seu calendário agora acompanha automaticamente a execução do manejo do seu rebanho.
        </p>
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-white/30 italic">
            Em breve: ações do dia, manejos do mês e próximos manejos.
          </p>
        </div>
      </div>
    );
  }

  // state === "preview"
  return (
    <div className={`${CARD} p-6 sm:p-7 space-y-7`}>
      {/* ── Cabeçalho ── */}
      <div className="space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#CC0000]/15 flex items-center justify-center">
          <ClipboardCheck className="h-7 w-7 text-[#CC0000]" />
        </div>
        <div className="space-y-2.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#CC0000]/15 text-[#CC0000] text-[10px] font-bold uppercase tracking-widest">
            Novo recurso
          </span>
          <h2 className="text-xl font-bold text-white leading-tight">Central de Manejo</h2>
          <p className="text-sm text-white/55 leading-relaxed max-w-sm">
            Organize, acompanhe e registre automaticamente todos os manejos sanitários
            do seu rebanho em um único lugar.
          </p>
        </div>
      </div>

      {/* ── Benefícios ── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-start gap-2.5">
            <Icon className="h-4 w-4 text-[#CC0000]/80 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-white/75 leading-snug">{label}</span>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <button
        type="button"
        disabled
        className="w-full py-4 rounded-2xl bg-[#CC0000] text-white text-sm font-bold tracking-wide hover:bg-[#AA0000] transition-colors"
      >
        Ativar Central de Manejo
      </button>
    </div>
  );
}
