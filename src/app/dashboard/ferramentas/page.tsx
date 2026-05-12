import { Wrench, Calculator, BookOpen, BarChart3 } from "lucide-react";

export const runtime = "edge";

const TOOLS = [
  {
    icon: Calculator,
    title: "Calculadora de Doses",
    description: "Calcule doses de vacinas e medicamentos pelo peso do animal.",
    badge: "Em breve",
  },
  {
    icon: BookOpen,
    title: "Protocolo Sanitário",
    description: "Guia prático de protocolos para diferentes tipos de manejo.",
    badge: "Em breve",
  },
  {
    icon: BarChart3,
    title: "Relatório do Rebanho",
    description: "Visualize métricas e indicadores sanitários do seu rebanho.",
    badge: "Em breve",
  },
  {
    icon: Wrench,
    title: "Mais ferramentas",
    description: "Novas ferramentas úteis chegando em breve para você.",
    badge: "Em breve",
  },
];

export default function FerramentasPage() {
  return (
    <div className="bg-[#F6F6F6] min-h-screen">

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <h1 className="text-base font-bold text-gray-900">Ferramentas</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {TOOLS.map(({ icon: Icon, title, description, badge }) => (
          <div
            key={title}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4 opacity-70"
          >
            <div className="w-10 h-10 rounded-xl bg-[#CC0000]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-[#CC0000]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  {badge}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </main>

    </div>
  );
}
