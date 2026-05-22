"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Clock, ChevronDown, ChevronUp, X, RefreshCw } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar-events";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
type ActionType = "complete" | "postpone" | "skip";
type SectionId  = "atrasados" | "este-mes" | "proximo-mes";

interface ManejosOperacionalProps {
  overdue:        CalendarEvent[];
  thisMonth:      CalendarEvent[];
  nextMonth:      CalendarEvent[];
  continuous:     CalendarEvent[];
  curMonthName:   string;
  nextMonthName:  string | null;  // null = nenhum mês futuro com manejo
}

export function ManejosOperacional({
  overdue: io, thisMonth: itm, nextMonth: inm,
  continuous, curMonthName, nextMonthName,
}: ManejosOperacionalProps) {

  // Flat state — filtramos por grupo no render
  const cur = new Date().getMonth() + 1;
  // nxt = mês real do próximo manejo (vindo do server), não necessariamente cur+1
  const nxt = inm[0]?.month ?? null;

  const [events,  setEvents]  = useState(() => [...io, ...itm, ...inm]);
  const [open,    setOpen]    = useState<SectionId>("este-mes");
  const [modal,   setModal]   = useState<{ type: ActionType; event: CalendarEvent } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes,        setNotes]        = useState("");
  const [completedAt,  setCompletedAt]  = useState(() => new Date().toISOString().slice(0, 10));
  const [postponedTo,  setPostponedTo]  = useState("");

  const refs: Record<SectionId, React.RefObject<HTMLDivElement | null>> = {
    "atrasados":   useRef(null),
    "este-mes":    useRef(null),
    "proximo-mes": useRef(null),
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SectionId;
    if (hash && refs[hash]) {
      setOpen(hash);
      setTimeout(() => refs[hash].current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overdue      = events.filter((e) => (e.month ?? 0) < cur);
  const thisMonthEvs = events.filter((e) => e.month === cur);
  const nextMonthEvs = nxt !== null ? events.filter((e) => e.month === nxt) : [];

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

  // Categorias únicas (contínuos + scheduled)
  const categories = [
    ...new Set([
      ...events.map((e) => e.category_name),
      ...continuous.map((e) => e.category_name),
    ].filter(Boolean)),
  ] as string[];

  return (
    <div className="space-y-3">

      {/* ── Atrasados ── */}
      <Section
        id="atrasados"
        ref={refs["atrasados"]}
        label="Atrasados"
        count={overdue.length}
        labelColor="text-amber-600"
        countBg="bg-amber-100 text-amber-700"
        defaultOpen={false}
        open={open === "atrasados"}
        onToggle={() => setOpen((p) => p === "atrasados" ? "este-mes" : "atrasados")}
        empty="Nenhum manejo atrasado."
      >
        {overdue.map((e) => <EventRow key={e.id} event={e} onAction={openModal} />)}
      </Section>

      {/* ── Este mês ── */}
      <Section
        id="este-mes"
        ref={refs["este-mes"]}
        label={`${curMonthName} — este mês`}
        count={thisMonthEvs.length}
        labelColor="text-[#CC0000]"
        countBg="bg-[#CC0000]/10 text-[#CC0000]"
        defaultOpen
        open={open === "este-mes"}
        onToggle={() => setOpen((p) => p === "este-mes" ? "atrasados" : "este-mes")}
        empty="Nenhum manejo programado para este mês."
      >
        {thisMonthEvs.map((e) => <EventRow key={e.id} event={e} onAction={openModal} />)}
      </Section>

      {/* ── Próximo manejo ── */}
      {nextMonthName ? (
        <Section
          id="proximo-mes"
          ref={refs["proximo-mes"]}
          label={`Próximo manejo: ${nextMonthName}`}
          count={nextMonthEvs.length}
          labelColor="text-gray-700"
          countBg="bg-gray-100 text-gray-600"
          defaultOpen={false}
          open={open === "proximo-mes"}
          onToggle={() => setOpen((p) => p === "proximo-mes" ? "este-mes" : "proximo-mes")}
          empty="Nenhum manejo previsto."
        >
          {nextMonthEvs.map((e) => <EventRow key={e.id} event={e} onAction={openModal} />)}
        </Section>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-gray-400">Nenhum manejo futuro programado no calendário.</p>
        </div>
      )}

      {/* ── Categorias de manejo ── */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categorias de manejo</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600"
              >
                <RefreshCw className="h-3 w-3 text-gray-400" />
                {cat}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Protocolos contínuos — aplicar conforme nascimentos e necessidades do rebanho.
          </p>
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

import React from "react";

interface SectionProps {
  id: SectionId;
  label: string;
  count: number;
  labelColor: string;
  countBg: string;
  defaultOpen: boolean;
  open: boolean;
  onToggle: () => void;
  empty: string;
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  function Section({ id, label, count, labelColor, countBg, open, onToggle, empty, children }, ref) {
    return (
      <div id={id} ref={ref} className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${labelColor}`}>{label}</span>
            {count > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${countBg}`}>{count}</span>
            )}
          </div>
          {open
            ? <ChevronUp className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </button>

        {open && (
          <div className="border-t border-gray-100">
            {count === 0 ? (
              <div className="px-4 py-4 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-gray-400">{empty}</p>
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

function EventRow({ event, onAction }: {
  event: CalendarEvent;
  onAction: (type: ActionType, event: CalendarEvent) => void;
}) {
  const monthLabel = event.month ? MONTHS[event.month - 1] : null;

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#CC0000] flex-shrink-0 mt-2" />
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
