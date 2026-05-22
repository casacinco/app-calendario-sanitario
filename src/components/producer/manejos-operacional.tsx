"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, ChevronDown, X, AlertCircle } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar-events";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
type ActionType = "complete" | "postpone" | "skip";
type SectionId  = "atrasados" | "este-mes" | "proximo-mes";

type SectionTheme = {
  accent:   string;  // hex color for left border and dot
  badgeBg:  string;
  badgeTxt: string;
  dot:      string;  // tailwind bg-* class (used in purged context)
};

const THEMES: Record<SectionId, SectionTheme> = {
  "atrasados":   { accent: "#EF4444", badgeBg: "bg-[#FEF2F2]", badgeTxt: "text-[#DC2626]", dot: "bg-[#EF4444]" },
  "este-mes":    { accent: "#FBBF24", badgeBg: "bg-amber-50",  badgeTxt: "text-amber-700", dot: "bg-amber-400" },
  "proximo-mes": { accent: "#22C55E", badgeBg: "bg-[#F0FDF4]", badgeTxt: "text-[#16A34A]", dot: "bg-[#22C55E]" },
};

interface ManejosOperacionalProps {
  overdue:       CalendarEvent[];
  thisMonth:     CalendarEvent[];
  nextMonth:     CalendarEvent[];
  continuous:    CalendarEvent[];
  implantacao:   CalendarEvent[];
  curMonthName:  string;
  nextMonthName: string | null;
}

export function ManejosOperacional({
  overdue: io, thisMonth: itm, nextMonth: inm,
  continuous, implantacao: iimpl, curMonthName, nextMonthName,
}: ManejosOperacionalProps) {

  const router = useRouter();
  const cur = new Date().getMonth() + 1;
  const nxt = inm[0]?.month ?? null;

  const [events,     setEvents]     = useState(() => [...io, ...itm, ...inm]);
  const [implEvents, setImplEvents] = useState(() => [...iimpl]);

  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    "atrasados":   false,
    "este-mes":    true,
    "proximo-mes": false,
  });
  const [modal,       setModal]       = useState<{ type: ActionType; event: CalendarEvent } | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [notes,       setNotes]       = useState("");
  const [completedAt, setCompletedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [postponedTo, setPostponedTo] = useState("");
  const [reforcoConfirm, setReforcoConfirm] = useState<{
    appDate: string; reforcoDate: string; title: string;
  } | null>(null);

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

  function toggle(id: SectionId) { setOpen((prev) => ({ ...prev, [id]: !prev[id] })); }

  function removeEvent(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setImplEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function openModal(type: ActionType, event: CalendarEvent) {
    setModal({ type, event });
    setNotes("");
    setCompletedAt(new Date().toISOString().slice(0, 10));
    setPostponedTo("");
  }

  function isDoseReforco(event: CalendarEvent) {
    return !event.is_reforco && (event.recommendation ?? "").toUpperCase().includes("DOSE + REFORÇO");
  }

  function fmtDateBR(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
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
      const data = await res.json() as { reforco?: { created: boolean; due_date: string } };
      const capturedModal = modal;
      removeEvent(capturedModal.event.id);
      setModal(null);
      if (data.reforco && isDoseReforco(capturedModal.event)) {
        setReforcoConfirm({
          appDate:    completedAt,
          reforcoDate: data.reforco.due_date,
          title:      capturedModal.event.title,
        });
        router.refresh();
      }
    }
  }

  return (
    <div className="space-y-2.5">

      {/* ── Ação imediata ── */}
      {implEvents.length > 0 && (
        <div style={{ borderLeftColor: "#B91C1C" }} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 border-l-[3px]">
          <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-gray-100">
            <AlertCircle className="h-3.5 w-3.5 text-[#B91C1C] flex-shrink-0" />
            <span className="text-sm font-bold text-gray-900">Ação imediata recomendada</span>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626]">
              {implEvents.length}
            </span>
          </div>
          <div className="px-4 divide-y divide-gray-50">
            {implEvents.map((e) => (
              <ImplantacaoRow key={e.id} event={e} onAction={openModal} />
            ))}
          </div>
        </div>
      )}

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
        label={`${curMonthName}`}
        sublabel="este mês"
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
          label={nextMonthName}
          sublabel="próximo manejo"
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
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-2.5 border border-gray-100">
          <CheckCircle2 className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
          <p className="text-sm text-gray-400">Nenhum manejo futuro programado no calendário.</p>
        </div>
      )}

      {/* ── Confirmação de dose+reforço ── */}
      {reforcoConfirm && (
        <div style={{ borderLeftColor: "#16A34A" }} className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-start gap-3 border border-gray-100 border-l-[3px]">
          <CheckCircle2 className="h-4 w-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Dose registrada com sucesso</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Aplicado em {fmtDateBR(reforcoConfirm.appDate)}.
              Reforço programado para {fmtDateBR(reforcoConfirm.reforcoDate)}.
            </p>
          </div>
          <button onClick={() => setReforcoConfirm(null)} className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  {modal.type === "complete" && isDoseReforco(modal.event)
                    ? "Registrar aplicação da dose"
                    : modal.type === "complete" ? "Confirmar realização"
                    : modal.type === "postpone" ? "Adiar manejo"
                    : "Não realizado"}
                </p>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">{modal.event.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal.event.category_name}</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modal.type === "complete" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  {isDoseReforco(modal.event) ? "Data da aplicação" : "Data da realização"}
                </label>
                <input type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                {isDoseReforco(modal.event) && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    O reforço será programado automaticamente após a confirmação.
                  </p>
                )}
              </div>
            )}

            {modal.type === "postpone" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Adiar para</label>
                <input type="date" value={postponedTo} onChange={(e) => setPostponedTo(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Observações <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Ex: aplicado por João, produto X..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirm}
                disabled={loading || (modal.type === "postpone" && !postponedTo)}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold disabled:opacity-40 hover:bg-gray-700 transition-colors">
                {loading
                  ? "Salvando..."
                  : modal.type === "complete" && isDoseReforco(modal.event)
                    ? "Confirmar aplicação"
                    : "Confirmar"}
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
  id:        SectionId;
  theme:     SectionTheme;
  label:     string;
  sublabel?: string;
  count:     number;
  open:      boolean;
  onToggle:  () => void;
  empty:     string;
  children:  React.ReactNode;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  function Section({ id, theme, label, sublabel, count, open, onToggle, empty, children }, ref) {
    return (
      <div
        id={id}
        ref={ref}
        style={{ borderLeftColor: theme.accent }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 border-l-[3px]"
      >
        {/* Header */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/60 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${theme.dot} flex-shrink-0`} />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-900">{label}</span>
              {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
            </div>
            {count > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeTxt}`}>
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400 font-medium">{open ? "fechar" : "ver"}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/* Content */}
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? "max-h-[2000px]" : "max-h-0"}`}>
          <div className="border-t border-gray-100">
            {count === 0 ? (
              <div className="px-4 py-4 flex items-center gap-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                <p className="text-sm text-gray-400">{empty}</p>
              </div>
            ) : (
              <div className="px-4 divide-y divide-gray-50">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

// ── ImplantacaoRow ────────────────────────────────────────────────────────────

function ImplantacaoRow({ event, onAction }: {
  event:    CalendarEvent;
  onAction: (type: ActionType, event: CalendarEvent) => void;
}) {
  return (
    <div className="py-3.5 last:pb-3">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] flex-shrink-0 mt-[7px]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{event.category_name}</p>
          {event.recommendation && (
            <p className="text-[11px] text-[#B91C1C] font-semibold mt-1">{event.recommendation}</p>
          )}
        </div>
      </div>
      <div className="pl-4">
        <button
          onClick={() => onAction("complete", event)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold hover:bg-gray-700 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          Registrar aplicação
        </button>
      </div>
    </div>
  );
}

// ── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event, dot, onAction }: {
  event:    CalendarEvent;
  dot:      string;
  onAction: (type: ActionType, event: CalendarEvent) => void;
}) {
  const monthLabel = event.month ? MONTHS[event.month - 1] : null;

  return (
    <div className="py-3.5 last:pb-3">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0 mt-[7px]`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {event.category_name}{monthLabel ? ` · ${monthLabel}` : ""}
          </p>
          {event.recommendation && (
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{event.recommendation}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 pl-4">
        <button onClick={() => onAction("complete", event)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#16A34A] text-white text-[11px] font-bold hover:bg-[#15803D] transition-colors">
          <CheckCircle2 className="h-3 w-3" />Realizado
        </button>
        <button onClick={() => onAction("postpone", event)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 text-[11px] font-bold hover:bg-gray-50 transition-colors">
          <Clock className="h-3 w-3" />Adiar
        </button>
        <button onClick={() => onAction("skip", event)}
          className="px-3 py-1.5 rounded-full border border-[#DC2626] text-[#DC2626] text-[11px] font-bold hover:bg-[#FEF2F2] transition-colors">
          Não realizado
        </button>
      </div>
    </div>
  );
}
