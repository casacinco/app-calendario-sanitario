"use client";

import { useState } from "react";
import { CheckCircle2, Clock, RefreshCw, X, ChevronDown, ChevronUp } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar-events";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

interface ManejoDashboardProps {
  scheduled:  CalendarEvent[];
  continuous: CalendarEvent[];
}

type ActionType = "complete" | "postpone" | "skip";

export function ManejoDashboard({ scheduled: init_s, continuous: init_c }: ManejoDashboardProps) {
  const [scheduled,  setScheduled]  = useState(init_s);
  const [continuous, setContinuous] = useState(init_c);
  const [modal,      setModal]      = useState<{ type: ActionType; event: CalendarEvent } | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [notes,      setNotes]      = useState("");
  const [completedAt, setCompletedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [postponedTo, setPostponedTo] = useState("");
  const [expanded,   setExpanded]   = useState<Set<number>>(new Set());

  const currentMonth = new Date().getMonth() + 1;
  const thisMonth = scheduled.filter((e) => e.month === currentMonth);
  const upcoming  = scheduled.filter((e) => (e.month ?? 0) > currentMonth);
  const overdue   = scheduled.filter((e) => (e.month ?? 0) < currentMonth);

  function openModal(type: ActionType, event: CalendarEvent) {
    setModal({ type, event });
    setNotes("");
    setCompletedAt(new Date().toISOString().slice(0, 10));
    setPostponedTo("");
  }

  function closeModal() {
    setModal(null);
  }

  async function handleConfirm() {
    if (!modal) return;
    setLoading(true);

    const body: Record<string, string> = { action: modal.type };
    if (notes)      body.notes        = notes;
    if (modal.type === "complete"  && completedAt) body.completed_at = completedAt;
    if (modal.type === "postpone"  && postponedTo) body.postponed_to = postponedTo;

    const res = await fetch(`/api/dashboard/events/${modal.event.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    setLoading(false);

    if (res.ok) {
      const { event: updated } = await res.json<{ event: CalendarEvent }>();
      if (modal.type === "complete" || modal.type === "skip") {
        setScheduled((prev) => prev.filter((e) => e.id !== modal.event.id));
      } else if (modal.type === "postpone" && updated) {
        setScheduled((prev) => prev.map((e) => (e.id === modal.event.id ? { ...e, ...updated } : e)));
      }
      closeModal();
    }
  }

  function toggleContinuous(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* ── Próximos manejos ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Próximos manejos</p>
          {scheduled.length > 0 && (
            <span className="text-[10px] font-bold text-[#CC0000] bg-[#CC0000]/10 px-2 py-0.5 rounded-full">
              {scheduled.length} pendente{scheduled.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {scheduled.length === 0 ? (
          <div className="px-4 pb-4 pt-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-gray-500">Todos os manejos em dia.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 pb-2">
            {overdue.length > 0 && (
              <EventGroup label="Atrasados" labelClass="text-amber-600" events={overdue} onAction={openModal} />
            )}
            {thisMonth.length > 0 && (
              <EventGroup label="Este mês" labelClass="text-[#CC0000]" events={thisMonth} onAction={openModal} />
            )}
            {upcoming.length > 0 && (
              <EventGroup label="Próximos" labelClass="text-gray-400" events={upcoming} onAction={openModal} />
            )}
          </div>
        )}
      </div>

      {/* ── Protocolos contínuos ── */}
      {continuous.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Protocolos ativos</p>
          </div>
          <div className="divide-y divide-gray-50 pb-2">
            {continuous.map((event) => {
              const open = expanded.has(event.id);
              return (
                <div key={event.id} className="px-4 py-3">
                  <button
                    onClick={() => toggleContinuous(event.id)}
                    className="w-full flex items-start justify-between gap-3 text-left"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RefreshCw className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{event.category_name}</p>
                      </div>
                    </div>
                    {open
                      ? <ChevronUp className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
                      : <ChevronDown className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
                    }
                  </button>

                  {open && (
                    <div className="mt-2 ml-8 space-y-1.5">
                      {event.recommendation && (
                        <p className="text-xs text-gray-600 leading-relaxed">{event.recommendation}</p>
                      )}
                      <p className="text-[11px] text-blue-500 font-medium">
                        Aplicar conforme nascimento / necessidade
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  {modal.type === "complete" ? "Confirmar realização"
                    : modal.type === "postpone" ? "Adiar manejo"
                    : "Marcar como não realizado"}
                </p>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">
                  {modal.event.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal.event.category_name}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modal.type === "complete" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Data da realização</label>
                <input
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                />
              </div>
            )}

            {modal.type === "postpone" && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Adiar para</label>
                <input
                  type="date"
                  value={postponedTo}
                  onChange={(e) => setPostponedTo(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Observações <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Aplicado por João, produto X..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (modal.type === "postpone" && !postponedTo)}
                className="flex-1 py-3 rounded-xl bg-[#CC0000] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#AA0000] transition-colors"
              >
                {loading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-componentes internos ──────────────────────────────────────────────────

function EventGroup({
  label, labelClass, events, onAction,
}: {
  label: string;
  labelClass: string;
  events: CalendarEvent[];
  onAction: (type: ActionType, event: CalendarEvent) => void;
}) {
  return (
    <div className="px-4 py-2">
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>{label}</p>
      <div className="space-y-3">
        {events.map((event) => (
          <EventRow key={event.id} event={event} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function EventRow({
  event, onAction,
}: {
  event: CalendarEvent;
  onAction: (type: ActionType, event: CalendarEvent) => void;
}) {
  const monthLabel = event.month ? MONTHS[event.month - 1] : null;

  return (
    <div className="py-1">
      <div className="flex items-start gap-2.5 mb-2">
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
      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onAction("complete", event)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#CC0000]/10 text-[#CC0000] text-xs font-bold hover:bg-[#CC0000]/20 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Realizado
        </button>
        <button
          onClick={() => onAction("postpone", event)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
        >
          <Clock className="h-3.5 w-3.5" />
          Adiar
        </button>
        <button
          onClick={() => onAction("skip", event)}
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-bold hover:bg-gray-200 transition-colors"
        >
          Não realizado
        </button>
      </div>
    </div>
  );
}
