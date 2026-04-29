"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

const RACAS_REPR = ["Dorper","White Dorper","Santa Inês","Somális","Morada Nova","Mestiços","Textel","Merino","Outro"];
const RACAS_MATR = ["Dorper","White Dorper","Santa Inês","Somális","Morada Nova","Mestiças","Textel","Merino","Outro"];

const SISTEMAS: { label: string; desc: string }[] = [
  {
    label: "CICLO COMPLETO - 100% pasto",
    desc: "Rebanho criado a pasto durante todo o ciclo produtivo.",
  },
  {
    label: "CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento",
    desc: "Rebanho criado a pasto, com uso de confinamento ou semi-confinamento em alguns períodos.",
  },
  {
    label: "CICLO COMPLETO - 100% confinado",
    desc: "Todas as categorias permanecem em sistema confinado durante o ciclo produtivo.",
  },
  {
    label: "100% Confinamento de cordeiro",
    desc: "Apenas os cordeiros são terminados em confinamento.",
  },
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const CAUSAS_OBITO = [
  "Cobra","Intoxicação por plantas tóxicas","Raiva","Verminose",
  "Morte súbita","Predadores","Pneumonia","Manqueira","Outro",
];

const VACINAS_LIST = [
  "Clostridiose","Raiva","Pneumonia","Foot-rot","Linfadenite","Leptospirose","Outro",
];

const FREQUENCIAS = ["Alta","Média","Baixa"];

const META = [
  { section: "Identificação",     title: "Identificação",          desc: "Comece nos dizendo quem é você." },
  { section: "Propriedade",       title: "Propriedade",            desc: "Informações sobre o responsável e o rebanho." },
  { section: "Rebanho",           title: "Composição do rebanho",  desc: null },
  { section: "Sistema de criação",title: "Sistema de criação",     desc: null },
  { section: "Condições ambientais", title: "Condições ambientais", desc: "Sazonalidade da sua região." },
  { section: "Reprodução",        title: "Reprodução",             desc: "Manejo reprodutivo do rebanho." },
  { section: "Sanitário",         title: "Sanitário",              desc: "Histórico sanitário e desafios do rebanho." },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface F {
  nome: string; email: string; instagram: string; telefone: string;
  nome_proprietario: string; nome_rebanho: string; inicio_criacao: string;
  qtd_reprodutores: string; racas_reprodutores: string[];
  qtd_matrizes: string; racas_matrizes: string[];
  sistema_criacao: string; pais: string; estado: string;
  cidade_brasil: string; cidade_fora: string; propriedades_vizinhas: string;
  meses_chuva: string[];
  meses_monta: string[]; idade_apartacao: string;
  assistencia_vet: string; possui_calendario: string;
  causas_obito: string[]; frequencia_obito: string; vacinas: string[];
  decisao_compra: string; mortalidade_atual: string;
  ja_tentou: string; info_adicionais: string; espera_alcancar: string;
}

type MultiKey = "racas_reprodutores" | "racas_matrizes" | "meses_chuva" | "meses_monta" | "causas_obito" | "vacinas";

const BLANK: F = {
  nome: "", email: "", instagram: "", telefone: "",
  nome_proprietario: "", nome_rebanho: "", inicio_criacao: "",
  qtd_reprodutores: "", racas_reprodutores: [], qtd_matrizes: "", racas_matrizes: [],
  sistema_criacao: "", pais: "Brasil", estado: "", cidade_brasil: "", cidade_fora: "", propriedades_vizinhas: "",
  meses_chuva: [],
  meses_monta: [], idade_apartacao: "",
  assistencia_vet: "", possui_calendario: "",
  causas_obito: [], frequencia_obito: "", vacinas: [],
  decisao_compra: "", mortalidade_atual: "", ja_tentou: "", info_adicionais: "", espera_alcancar: "",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function FLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <p className="text-sm font-semibold text-white mb-2">
      {text}{required && <span className="text-[hsl(var(--red))]"> *</span>}
    </p>
  );
}

function FInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const filled = value.length > 0;
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full border rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none transition-colors",
        filled
          ? "bg-white text-black border-white/40 placeholder:text-black/30"
          : "bg-[#111111] text-white border-[hsl(var(--border))] focus:bg-white focus:text-black focus:border-white/40 focus:placeholder:text-black/30",
      )}
    />
  );
}

function FTextarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const filled = value.length > 0;
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full border rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none resize-none transition-colors",
        filled
          ? "bg-white text-black border-white/40 placeholder:text-black/30"
          : "bg-[#111111] text-white border-[hsl(var(--border))] focus:bg-white focus:text-black focus:border-white/40 focus:placeholder:text-black/30",
      )}
    />
  );
}

function FSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#111111] border border-[hsl(var(--border))] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
    >
      <option value="">Selecione…</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function RadioOpt({ label, desc, checked, onSelect }: { label: string; desc?: string; checked: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors",
        checked
          ? "border-[hsl(var(--red))] bg-[hsl(var(--red))]/5"
          : "border-[hsl(var(--border))] hover:border-white/25",
      )}
    >
      <span className={cn(
        "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
        checked ? "border-[hsl(var(--red))]" : "border-white/40",
      )}>
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--red))] block" />}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white">{label}</span>
        {desc && <p className="text-xs text-white/40 mt-0.5">{desc}</p>}
      </div>
    </button>
  );
}

function CheckOpt({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors",
        checked
          ? "border-[hsl(var(--red))] bg-[hsl(var(--red))]/5"
          : "border-[hsl(var(--border))] hover:border-white/25",
      )}
    >
      <span className={cn(
        "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0",
        checked ? "border-[hsl(var(--red))] bg-[hsl(var(--red))]" : "border-white/40",
      )}>
        {checked && <Check className="h-3 w-3 text-white" />}
      </span>
      <span className="text-sm text-white">{label}</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FormularioForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [f, setF] = useState<F>(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rb_user");
      if (raw) {
        const user = JSON.parse(raw) as { name?: string; email?: string };
        setF((prev) => ({
          ...prev,
          nome: user.name ?? prev.nome,
          email: user.email ?? prev.email,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  function set<K extends keyof F>(key: K, val: F[K]) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  function toggle(key: MultiKey, val: string) {
    setF((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  }

  function isValid(): boolean {
    switch (step) {
      case 1: return !!(f.nome && f.email && f.instagram && f.telefone);
      case 2: return !!(f.nome_proprietario && f.nome_rebanho && f.inicio_criacao);
      case 3: return !!(f.qtd_reprodutores && f.racas_reprodutores.length && f.qtd_matrizes && f.racas_matrizes.length);
      case 4: return !!(f.sistema_criacao && f.estado && (f.pais === "Brasil" ? f.cidade_brasil : f.cidade_fora));
      case 5: return f.meses_chuva.length > 0;
      case 6: return !!(f.meses_monta.length && f.idade_apartacao);
      case 7: return !!(
        f.assistencia_vet && f.possui_calendario &&
        f.causas_obito.length && f.frequencia_obito &&
        f.vacinas.length && f.decisao_compra &&
        f.mortalidade_atual && f.ja_tentou && f.espera_alcancar
      );
      default: return false;
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { name: f.nome, email: f.email },
          farm: {
            name: f.nome_rebanho,
            state: f.estado || undefined,
            city: f.pais === "Brasil" ? (f.cidade_brasil || undefined) : (f.cidade_fora || undefined),
            notes: f.sistema_criacao || undefined,
          },
          flock: {
            species: [...f.racas_reprodutores, ...f.racas_matrizes].join(", ") || "Ovinos",
            total_animals:
              (parseInt(f.qtd_reprodutores) || 0) + (parseInt(f.qtd_matrizes) || 0) || undefined,
            housing_type: f.sistema_criacao || undefined,
            age_groups: `Reprodutores: ${f.qtd_reprodutores} (${f.racas_reprodutores.join(", ")}); Matrizes: ${f.qtd_matrizes} (${f.racas_matrizes.join(", ")})`,
          },
          questionnaire: {
            veterinary_assistance: f.assistencia_vet,
            vaccination_history: f.vacinas.join(", "),
            additional_info: f.info_adicionais || undefined,
            raw_responses: JSON.stringify({
              nome: f.nome,
              email: f.email,
              instagram: f.instagram,
              telefone: f.telefone,
              nome_proprietario: f.nome_proprietario,
              nome_rebanho: f.nome_rebanho,
              inicio_criacao: f.inicio_criacao,
              qtd_reprodutores: f.qtd_reprodutores,
              racas_reprodutores: f.racas_reprodutores,
              qtd_matrizes: f.qtd_matrizes,
              racas_matrizes: f.racas_matrizes,
              sistema_criacao: f.sistema_criacao,
              pais: f.pais,
              estado: f.estado,
              cidade_brasil: f.cidade_brasil,
              cidade_fora: f.cidade_fora,
              propriedades_vizinhas: f.propriedades_vizinhas,
              meses_chuva: f.meses_chuva,
              meses_monta: f.meses_monta,
              idade_apartacao: f.idade_apartacao,
              assistencia_vet: f.assistencia_vet,
              possui_calendario: f.possui_calendario,
              causas_obito: f.causas_obito,
              frequencia_obito: f.frequencia_obito,
              vacinas: f.vacinas,
              decisao_compra: f.decisao_compra,
              mortalidade_atual: f.mortalidade_atual,
              ja_tentou: f.ja_tentou,
              info_adicionais: f.info_adicionais,
              espera_alcancar: f.espera_alcancar,
            }),
          },
          deadline: deadline.toISOString().split("T")[0],
        }),
      });
      const data = await res.json<{ request?: { id: number }; error?: string }>();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      router.push(`/sucesso?id=${data.request!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
      setSubmitting(false);
    }
  }

  // ─── Steps ───────────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <FLabel text="Seu nome completo" required />
              <FInput value={f.nome} onChange={(v) => set("nome", v)} placeholder="Nome completo" />
            </div>
            <div>
              <FLabel text="Seu e-mail" required />
              <FInput type="email" value={f.email} onChange={(v) => set("email", v)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <FLabel text="Nome do Instagram" required />
              <FInput value={f.instagram} onChange={(v) => set("instagram", v)} placeholder="@seuinstagram" />
            </div>
            <div>
              <FLabel text="Telefone para contato / WhatsApp" required />
              <FInput type="tel" value={f.telefone} onChange={(v) => set("telefone", v)} placeholder="(00) 00000-0000" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <FLabel text="Nome do proprietário do rebanho" required />
              <FInput value={f.nome_proprietario} onChange={(v) => set("nome_proprietario", v)} />
            </div>
            <div>
              <FLabel text="Nome do rebanho ou cabanha" required />
              <FInput value={f.nome_rebanho} onChange={(v) => set("nome_rebanho", v)} />
            </div>
            <div>
              <FLabel text="Data de início da criação" required />
              <FInput type="date" value={f.inicio_criacao} onChange={(v) => set("inicio_criacao", v)} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <FLabel text="Quantidade de reprodutores" required />
              <FInput type="number" value={f.qtd_reprodutores} onChange={(v) => set("qtd_reprodutores", v)} placeholder="0" />
            </div>
            <div>
              <FLabel text="Raça dos reprodutores" required />
              <p className="text-xs text-white/40 mb-3">Você pode marcar mais de uma opção.</p>
              <div className="space-y-2">
                {RACAS_REPR.map((r) => (
                  <CheckOpt key={r} label={r} checked={f.racas_reprodutores.includes(r)} onToggle={() => toggle("racas_reprodutores", r)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="Quantidade de matrizes" required />
              <FInput type="number" value={f.qtd_matrizes} onChange={(v) => set("qtd_matrizes", v)} placeholder="0" />
            </div>
            <div>
              <FLabel text="Raça das matrizes" required />
              <p className="text-xs text-white/40 mb-3">Você pode marcar mais de uma opção.</p>
              <div className="space-y-2">
                {RACAS_MATR.map((r) => (
                  <CheckOpt key={r} label={r} checked={f.racas_matrizes.includes(r)} onToggle={() => toggle("racas_matrizes", r)} />
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div>
              <FLabel text="Sistema de criação" required />
              <div className="space-y-2">
                {SISTEMAS.map((s) => (
                  <RadioOpt key={s.label} label={s.label} desc={s.desc} checked={f.sistema_criacao === s.label} onSelect={() => set("sistema_criacao", s.label)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="País" required />
              <div className="flex gap-2">
                {["Brasil", "Outro"].map((p) => (
                  <RadioOpt key={p} label={p} checked={f.pais === p} onSelect={() => set("pais", p)} />
                ))}
              </div>
            </div>
            {f.pais === "Brasil" && (
              <>
                <div>
                  <FLabel text="Estado" required />
                  <FSelect value={f.estado} onChange={(v) => set("estado", v)} options={ESTADOS_BR} />
                </div>
                <div>
                  <FLabel text="Cidade no Brasil" required />
                  <FInput value={f.cidade_brasil} onChange={(v) => set("cidade_brasil", v)} />
                </div>
              </>
            )}
            {f.pais !== "Brasil" && (
              <div>
                <FLabel text="Cidade" required />
                <FInput value={f.cidade_fora} onChange={(v) => set("cidade_fora", v)} />
              </div>
            )}
            <div>
              <FLabel text="Propriedades vizinhas desenvolvem ovinocultura, caprinocultura ou bovinocultura?" />
              <p className="text-xs text-white/40 mb-2">Descreva livremente.</p>
              <FTextarea value={f.propriedades_vizinhas} onChange={(v) => set("propriedades_vizinhas", v)} />
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <FLabel text="Quais os meses de maior incidência de chuvas na sua região?" required />
            <p className="text-xs text-white/40 mb-3">Você pode marcar mais de uma opção.</p>
            <div className="grid grid-cols-2 gap-2">
              {MESES.map((m) => (
                <CheckOpt key={m} label={m} checked={f.meses_chuva.includes(m)} onToggle={() => toggle("meses_chuva", m)} />
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <FLabel text="Quais os meses você realiza a Estação de Monta?" required />
              <p className="text-xs text-white/40 mb-3">Você pode marcar mais de uma opção.</p>
              <div className="space-y-2">
                {["AINDA NÃO REALIZO A ESTAÇÃO DE MONTA", ...MESES].map((m) => (
                  <CheckOpt key={m} label={m} checked={f.meses_monta.includes(m)} onToggle={() => toggle("meses_monta", m)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="Idade de apartação" required />
              <FInput value={f.idade_apartacao} onChange={(v) => set("idade_apartacao", v)} placeholder="Ex.: 60 dias" />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <FLabel text="Possui assistência técnica veterinária?" required />
              <div className="space-y-2">
                {["Sim", "Não"].map((v) => (
                  <RadioOpt key={v} label={v} checked={f.assistencia_vet === v} onSelect={() => set("assistencia_vet", v)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="Possui outro Calendário Sanitário no seu rebanho?" required />
              <div className="space-y-2">
                {["Sim", "Não"].map((v) => (
                  <RadioOpt key={v} label={v} checked={f.possui_calendario === v} onSelect={() => set("possui_calendario", v)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="Em sua região quais os principais relatos de óbito dos ovinos?" required />
              <p className="text-xs text-white/40 mb-3">Você pode marcar mais de uma opção.</p>
              <div className="space-y-2">
                {CAUSAS_OBITO.map((c) => (
                  <CheckOpt key={c} label={c} checked={f.causas_obito.includes(c)} onToggle={() => toggle("causas_obito", c)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="Frequência" required />
              <div className="space-y-2">
                {FREQUENCIAS.map((v) => (
                  <RadioOpt key={v} label={v} checked={f.frequencia_obito === v} onSelect={() => set("frequencia_obito", v)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="Vacinas utilizadas no rebanho" required />
              <p className="text-xs text-white/40 mb-3">Você pode marcar mais de uma opção.</p>
              <div className="space-y-2">
                {VACINAS_LIST.map((v) => (
                  <CheckOpt key={v} label={v} checked={f.vacinas.includes(v)} onToggle={() => toggle("vacinas", v)} />
                ))}
              </div>
            </div>
            <div>
              <FLabel text="O que leva você a tomar a decisão de comprar um produto para o rebanho?" required />
              <FTextarea value={f.decisao_compra} onChange={(v) => set("decisao_compra", v)} placeholder="Conte o que motivou essa decisão neste momento." />
            </div>
            <div>
              <FLabel text="Qual a sua mortalidade atual?" required />
              <FTextarea value={f.mortalidade_atual} onChange={(v) => set("mortalidade_atual", v)} placeholder="Ex.: tenho 40 animais e perdi 5 esse ano" />
            </div>
            <div>
              <FLabel text="O que você já tentou para resolver o problema?" required />
              <FTextarea value={f.ja_tentou} onChange={(v) => set("ja_tentou", v)} placeholder="Descreva manejos, produtos ou estratégias que não trouxeram o resultado esperado." />
            </div>
            <div>
              <FLabel text="Informações adicionais" />
              <FTextarea value={f.info_adicionais} onChange={(v) => set("info_adicionais", v)} placeholder="Descreva aqui algo que deseje informar ao Léo e que não foi contemplado nas perguntas anteriores." />
            </div>
            <div>
              <FLabel text="O que você espera alcançar com o calendário sanitário?" required />
              <FTextarea value={f.espera_alcancar} onChange={(v) => set("espera_alcancar", v)} placeholder="Compartilhe o resultado que você espera obter." />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const meta = META[step - 1]!;
  const valid = isValid();

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-white" fill="white" />
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white">
              Rebanho
            </span>
          </div>
          <span className="text-[11px] font-semibold tracking-[0.15em] text-white">
            ETAPA {step} DE 7
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] bg-[hsl(var(--border))] flex-shrink-0">
          <div
            className="h-full bg-[hsl(var(--red))] transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Section label */}
        <div className="px-4 pt-4 pb-1 flex-shrink-0">
          <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            {meta.section}
          </span>
        </div>

        {/* Scrollable card */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
          <div className="bg-[hsl(var(--card))] rounded-xl p-5">
            <h2 className="text-xl font-bold text-white mb-1">{meta.title}</h2>
            {meta.desc && (
              <p className="text-sm text-white/50 mb-5">{meta.desc}</p>
            )}
            {renderStep()}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 px-4 py-2 bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/30 rounded-lg text-sm text-[hsl(var(--red))] flex-shrink-0">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="px-4 py-4 flex justify-between items-center border-t border-[hsl(var(--border))] flex-shrink-0">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm font-medium text-white disabled:opacity-30 hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          {step < 7 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!valid}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[hsl(var(--red))] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Avançar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || !valid}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[hsl(var(--red))] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
              ) : (
                <>Enviar solicitação</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
