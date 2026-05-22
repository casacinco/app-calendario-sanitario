"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar-events";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
type ActionType = "complete" | "postpone" | "skip";
type SectionId  = "atrasados" | "este-mes" | "proximo-mes";

// Tema visual por bloco
type SectionTheme = {
  header:    string;   // fundo do cabeçalho
  border:    string;   // separador cabeçalho / conteúdo
  label:     string;   // cor do título
  badge:     string;   // badge de contagem
  toggle:    string;   // botão ver/fechar
  toggleTxt: string;
  dot:       string;   // bolinha do evento
  content:   string;   // fundo do conteúdo
};

// Nota: bg-red-* e bg-green-* não funcionam pois o tailwind.config.ts sobrescreve
// os paletes red e green com CSS vars de cor única. Usamos valores arbitrários.
const THEMES: Record<SectionId, SectionTheme> = {
  "atrasados": {
    header:    "bg-[#FEE2E2]",
    border:    "border-[#FECACA]",
    label:     "text-[#991B1B]",
    badge:     "bg-[#FECACA] text-[#7F1D1D]",
    toggle:    "bg-[#FECACA] hover:bg-[#FCA5A5]",
    toggleTxt: "text-[#991B1B]",
    dot:       "bg-[#EF4444]",
    content:   "bg-[#FEF2F2]",
  },
  "este-mes": {
    header:    "bg-amber-100",
    border:    "border-amber-200",
    label:     "text-amber-900",
    badge:     "bg-amber-200 text-amber-900",
    toggle:    "bg-amber-200 hover:bg-amber-300",
    toggleTxt: "text-amber-800",
    dot:       "bg-amber-500",
    content:   "bg-amber-50",
  },
  "proximo-mes": {
    header:    "bg-[#DCFCE7]",
    border:    "border-[#BBF7D0]",
    label:     "text-[#14532D]",
    badge:     "bg-[#BBF7D0] text-[#14532D]",
    toggle:    "bg-[#BBF7D0] hover:bg-[#86EFAC]",
    toggleTxt: "text-[#166534]",
    dot:       "bg-[#22C55E]",
    content:   "bg-[#F0FDF4]",
  },
};

interface ManejosOperacionalProps {
  overdue:       CalendarEvent[];
  thisMonth:     CalendarEvent[];
  nextMonth:     CalendarEvent[];
  continuous:    CalendarEvent[];
  curMonthName:  string;
  nextMonthName: string | null;
}

export function ManejosOperacional({
  overdue: io, thisMonth: itm, nextMonth: inm,
  continuous, curMonthName, nextMonthName,
}: ManejosOperacionalProps) {

  const cur = new Date().getMonth() + 1;
  const nxt = inm[0]?.month ?? null;

  const [events,  setEvents]  = useState(() => [...io, ...itm, ...inm]);
  // Cada seção tem seu próprio estado aberto/fechado — independentes entre si
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    "atrasados":   false,
    "este-mes":    true,
    "proximo-mes": false,
  });
  const [modal,   setModal]   = useState<{ type: ActionType; event: CalendarEvent } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes,       setNotes]       = useState("");
  const [completedAt, setCompletedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [postponedTo, setPostponedTo] = useState("");

  const refs: Record<SectionId, React.RefObject<HTMLDivElement | null>> = {
    "atrasados":   useRef(null),
    "este-mes":    useRef(null),
    "proximo-mes": useRef(null),
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SectionId;
    if (hash && refs[hash]) {
      setOpen((prev) => ({ ...prev, [hash]: true }));
      setTimeout(() => refs[hash].current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overdueEvs   = events.filter((e) => (e.month ?? 0) < cur);
  const thisMonthEvs = events.filter((e) => e.month === cur);
  const nextMonthEvs = nxt !== null ? events.filter((e) => e.month === nxt) : [];

  function toggle(id: SectionId) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function removeEvent(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function openModal(type: ActionType, event: CalendarEvent) {
    setModal({ type, event });
    setNotes("");
    setCompletedAt(new Date().toISOString().slice(0, 10));
    setPostponedTo("");
  }

  async function handleConfirm() {
    if (!modal) return;
    setLoading(true);
    const body: Record<string, string> = { action: modal.type };
    if (notes)      body.notes        = notes;
    if (modal.type === "complete" && completedAt) body.completed_at = completedAt;
    if (modal.type === "postpone" && postponedTo) body.postponed_to = postponedTo;

    const res = await fetch(`/api/dashboard/events/${modal.event.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      removeEvent(modal.event.id);
      setModal(null);
    }
  }

  return (
    <div className="space-y-3">

      {/* ── Atrasados ── */}
      <Section
        id="atrasados"
        ref={refs["atrasados"]}
        theme={THEMES["atrasados"]}
        label="Atrasados"
        count={overdueEvs.length}
        open={open["atrasados"]}
        onToggle={() => toggle("atrasados")}
        empty="Nenhum manejo atrasado."
      >
        {overdueEvs.map((e) => (
          <EventRow key={e.id} event={e} dot={THEMES["atrasados"].dot} onAction={openModal} />
        ))}
      </Section>

      {/* ── Este mês ── */}
      <Section
        id="este-mes"
        ref={refs["este-mes"]}
        theme={THEMES["este-mes"]}
        label={`${curMonthName} — este mês`}
        count={thisMonthEvs.length}
        open={open["este-mes"]}
        onToggle={() => toggle("este-mes")}
        empty="Nenhum manejo programado para este mês."
      >
        {thisMonthEvs.map((e) => (
          <EventRow key={e.id} event={e} dot={THEMES["este-mes"].dot} onAction={openModal} />
        ))}
      </Section>

      {/* ── Próximo manejo ── */}
      {nextMonthName ? (
        <Section
          id="proximo-mes"
          ref={refs["proximo-mes"]}
          theme={THEMES["proximo-mes"]}
          label={`Próximo manejo: ${nextMonthName}`}
          count={nextMonthEvs.length}
          open={open["proximo-mes"]}
          onToggle={() => toggle("proximo-mes")}
          empty="Nenhum manejo previsto."
        >
          {nextMonthEvs.map((e) => (
            <EventRow key={e.id} event={e} dot={THEMES["proximo-mes"].dot} onAction={openModal} />
          ))}
        </Section>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-gray-400">Nenhum manejo futuro programado no calendário.</p>
        </div>
      )}


      {/* ── Modal de confirmação ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  {modal.type === "complete" ? "Confirmar realização"
                    : modal.type === "postpone" ? "Adiar manejo"
                    : "Não realizado"}
                </p>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">{modal.event.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal.event.category_name}</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modal.type === "complete" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Data da realização</label>
                <input type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
              </div>
            )}

            {modal.type === "postpone" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Adiar para</label>
                <input type="date" value={postponedTo} onChange={(e) => setPostponedTo(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Observações <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Ex: Aplicado por João, produto X..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirm}
                disabled={loading || (modal.type === "postpone" && !postponedTo)}
                className="flex-1 py-3 rounded-xl bg-[#CC0000] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#AA0000] transition-colors">
                {loading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

interface SectionProps {
  id:       SectionId;
  theme:    SectionTheme;
  label:    string;
  count:    number;
  open:     boolean;
  onToggle: () => void;
  empty:    string;
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  function Section({ id, theme, label, count, open, onToggle, empty, children }, ref) {
    return (
      <div id={id} ref={ref} className="rounded-2xl shadow-sm overflow-hidden border border-gray-100">

        {/* Cabeçalho clicável */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${theme.header} hover:brightness-95`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`text-sm font-bold ${theme.label}`}>{label}</span>
            {count > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                {count}
              </span>
            )}
          </div>

          {/* Botão de toggle explícito */}
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${theme.toggle} ${theme.toggleTxt}`}>
            {open
              ? <><ChevronUp className="h-3.5 w-3.5" />Fechar</>
              : <><ChevronDown className="h-3.5 w-3.5" />Ver</>
            }
          </span>
        </button>

        {/* Conteúdo */}
        {open && (
          <div className={`border-t ${theme.border} ${theme.content}`}>
            {count === 0 ? (
              <div className="px-4 py-4 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-gray-500">{empty}</p>
              </div>
            ) : (
              <div className="px-4 py-2 space-y-1 pb-3">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

// ── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event, dot, onAction }: {
  event:    CalendarEvent;
  dot:      string;
  onAction: (type: ActionType, event: CalendarEvent) => void;
}) {
  const monthLabel = event.month ? MONTHS[event.month - 1] : null;

  return (
    <div className="py-3 border-b border-gray-100/60 last:border-0">
      <div className="flex items-start gap-2 mb-2.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0 mt-2`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {event.category_name}{monthLabel ? ` · ${monthLabel}` : ""}
          </p>
          {event.recommendation && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{event.recommendation}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 pl-3.5">
        <button onClick={() => onAction("complete", event)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#CC0000]/10 text-[#CC0000] text-xs font-bold hover:bg-[#CC0000]/20 transition-colors">
          <CheckCircle2 className="h-3.5 w-3.5" />Realizado
        </button>
        <button onClick={() => onAction("postpone", event)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors">
          <Clock className="h-3.5 w-3.5" />Adiar
        </button>
        <button onClick={() => onAction("skip", event)}
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-bold hover:bg-gray-200 transition-colors">
          Não realizado
        </button>
      </div>
    </div>
  );
}
