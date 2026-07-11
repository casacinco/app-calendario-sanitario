import Image from "next/image";
import { ClipboardCheck, Bell, CalendarClock, Calculator, History, FileCheck2, ChevronRight } from "lucide-react";

type CentralManejoState = "producing" | "preview" | "active";

interface CentralDeManejoProps {
  state: CentralManejoState;
}

const BENEFITS_LEFT = [
  { icon: Bell,          title: "Lembretes automáticos",             sub: "Nunca mais perca um manejo" },
  { icon: CalendarClock, title: "Organização automática dos manejos", sub: "Tudo no lugar certo, na hora certa" },
  { icon: Calculator,    title: "Calculadora de doses",               sub: "Cálculo rápido e seguro" },
];

const BENEFITS_RIGHT = [
  { icon: History,    title: "Histórico completo dos manejos",       sub: "Registro e acompanhamento de tudo que foi feito" },
  { icon: FileCheck2, title: "Protocolos sanitários complementares", sub: "Protocolos exclusivos para apoiar seu manejo" },
];

const CARD = "rounded-3xl shadow-lg bg-[#111111]";
const MOCKUP_SRC = "/mockups/central-manejo-mockup-sf-cutout.png";
// Dimensões reais do asset — preserva a proporção original ao redimensionar via CSS.
const MOCKUP_W = 1755;
const MOCKUP_H = 3120;

function BenefitItem({ icon: Icon, title, sub }: { icon: typeof Bell; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-[#CC0000]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{title}</p>
        <p className="text-xs text-white/45 leading-snug">{sub}</p>
      </div>
    </div>
  );
}

export function CentralDeManejo({ state }: CentralDeManejoProps) {
  if (state === "producing") {
    return (
      <div className={`${CARD} overflow-hidden p-6 space-y-4`}>
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
      <div className={`${CARD} overflow-hidden p-6 space-y-4`}>
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
  // overflow visível de propósito: o mockup vaza a borda direita do card (ver seção MOCKUP do pedido).
  return (
    <div className={`${CARD} relative p-6 sm:p-8`}>
      <div className="sm:flex sm:items-start sm:gap-4">

        {/* ── Coluna de texto (lado esquerdo) ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Ícone + mockup mobile (canto superior direito, contido) */}
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#CC0000]/15 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="h-6 w-6 sm:h-7 sm:w-7 text-[#CC0000]" />
            </div>
            <div className="relative w-28 flex-shrink-0 sm:hidden">
              <div className="absolute -inset-4 rounded-full bg-[#CC0000] opacity-[0.12] blur-2xl" />
              <Image
                src={MOCKUP_SRC}
                alt="Tela da Central de Manejo no aplicativo"
                width={MOCKUP_W}
                height={MOCKUP_H}
                className="relative w-full h-auto rotate-3"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#CC0000]/15 text-[#CC0000] text-[10px] font-bold uppercase tracking-widest">
              Novo recurso
            </span>
            <h2 className="text-2xl font-bold text-white leading-tight">Central de Manejo</h2>
            <p className="text-sm text-white/55 leading-relaxed">
              Organize, acompanhe e registre todos os manejos sanitários do seu
              rebanho em um único lugar.
            </p>
          </div>

          {/* ── Benefícios: 2 colunas (3 esquerda / 2 direita), sem reordenar ── */}
          <div className="flex gap-4">
            <div className="flex-1 min-w-0 space-y-4">
              {BENEFITS_LEFT.map((b) => <BenefitItem key={b.title} {...b} />)}
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              {BENEFITS_RIGHT.map((b) => <BenefitItem key={b.title} {...b} />)}
            </div>
          </div>

          {/* ── CTA (largura da coluna de texto, não do card inteiro) ── */}
          <button
            type="button"
            disabled
            className="w-full py-3.5 px-6 rounded-2xl bg-[#CC0000] hover:bg-[#AA0000] transition-colors flex items-center justify-between"
          >
            <span className="text-base font-bold text-white">Ativar Central de Manejo</span>
            <ChevronRight className="h-5 w-5 text-white flex-shrink-0" />
          </button>
        </div>

        {/* ── Mockup desktop (lado direito, único elemento, vaza a borda) ── */}
        <div className="relative hidden sm:block sm:w-[44%] flex-shrink-0 self-start sm:-mr-[72px] sm:-mt-2">
          <div className="absolute -inset-8 rounded-full bg-[#CC0000] opacity-[0.12] blur-3xl" />
          <Image
            src={MOCKUP_SRC}
            alt="Tela da Central de Manejo no aplicativo"
            width={MOCKUP_W}
            height={MOCKUP_H}
            className="relative w-full h-auto rotate-3"
            priority
          />
        </div>
      </div>
    </div>
  );
}
