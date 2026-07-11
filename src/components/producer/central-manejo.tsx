import Image from "next/image";
import { ClipboardCheck, Bell, CalendarClock, Calculator, History, FileCheck2, ChevronRight } from "lucide-react";

type CentralManejoState = "producing" | "preview" | "active";

interface CentralDeManejoProps {
  state: CentralManejoState;
}

const BENEFITS = [
  { icon: Bell,          title: "Lembretes automáticos",             sub: "Nunca mais perca um manejo" },
  { icon: CalendarClock, title: "Organização automática dos manejos", sub: "Tudo no lugar certo, na hora certa" },
  { icon: Calculator,    title: "Calculadora de doses",               sub: "Cálculo rápido e seguro" },
  { icon: History,       title: "Histórico completo dos manejos",     sub: "Registro e acompanhamento de tudo que foi feito" },
  { icon: FileCheck2,    title: "Protocolos sanitários complementares", sub: "Protocolos exclusivos para apoiar seu manejo" },
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
  // Fundo preto puro (não o #111111 dos outros cards): o PNG do mockup não tem
  // canal alpha, seu fundo é rgb(0,0,0) opaco — só some sem emenda visível sobre preto puro.
  return (
    <div className="rounded-3xl overflow-hidden shadow-lg bg-black relative">
      <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#CC0000] opacity-[0.15] blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-8 p-6 sm:p-8">
        {/* ── Texto ── */}
        <div className="flex-1 min-w-0 space-y-7">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#CC0000]/15 flex items-center justify-center">
              <ClipboardCheck className="h-7 w-7 text-[#CC0000]" />
            </div>
            <div className="space-y-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#CC0000]/15 text-[#CC0000] text-[10px] font-bold uppercase tracking-widest">
                Novo recurso
              </span>
              <h2 className="text-2xl font-bold text-white leading-tight">Central de Manejo</h2>
              <p className="text-sm text-white/55 leading-relaxed max-w-sm">
                Organize, acompanhe e registre todos os manejos sanitários do seu
                rebanho em um único lugar.
              </p>
            </div>
          </div>

          {/* ── Benefícios ── */}
          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-[#CC0000]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">{title}</p>
                  <p className="text-xs text-white/45 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <button
            type="button"
            disabled
            className="w-full py-4 px-6 rounded-2xl bg-[#CC0000] hover:bg-[#AA0000] transition-colors flex items-center justify-between"
          >
            <span className="text-base font-bold text-white">Ativar Central de Manejo</span>
            <ChevronRight className="h-5 w-5 text-white flex-shrink-0" />
          </button>
        </div>

        {/* ── Mockup ── */}
        <div className="relative w-44 sm:w-52 mx-auto sm:mx-0 flex-shrink-0">
          <Image
            src="/mockups/central-manejo-mockup.png"
            alt="Tela da Central de Manejo no aplicativo"
            width={1024}
            height={1536}
            className="relative w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
