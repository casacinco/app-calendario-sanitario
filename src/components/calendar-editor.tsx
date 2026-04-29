"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import type { CalendarBar, CalendarBlockGroup } from "@/lib/db";
import { cn } from "@/lib/utils";
import { BarEditorDialog, type BarFormValue } from "@/components/bar-editor-dialog";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

interface DialogState {
  open: boolean;
  mode: "create" | "edit";
  rowId: number;
  blockPosition?: number;
  bar?: CalendarBar;
}

export function CalendarEditor({
  initialBlocks,
  readOnly = false,
}: {
  initialBlocks: CalendarBlockGroup[];
  readOnly?: boolean;
}) {
  const [blocks, setBlocks] = useState<CalendarBlockGroup[]>(initialBlocks);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: "create",
    rowId: 0,
  });

  function patchBlocks(
    updater: (blocks: CalendarBlockGroup[]) => CalendarBlockGroup[],
  ) {
    setBlocks((prev) => updater(prev));
  }

  async function toggleRow(rowId: number) {
    const res = await fetch(`/api/admin/rows/${rowId}/toggle`, { method: "POST" });
    const data = await res.json<{ row?: { is_active: number }; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    patchBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        rows: b.rows.map((r) =>
          r.id === rowId ? { ...r, is_active: data.row!.is_active } : r,
        ),
      })),
    );
  }

  async function createBar(rowId: number, value: BarFormValue) {
    const res = await fetch("/api/admin/bars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar_row_id: rowId, ...value }),
    });
    const data = await res.json<{ bar?: CalendarBar; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    patchBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        rows: b.rows.map((r) =>
          r.id === rowId ? { ...r, bars: [...r.bars, data.bar!] } : r,
        ),
      })),
    );
  }

  async function updateBar(barId: number, value: BarFormValue) {
    const res = await fetch(`/api/admin/bars/${barId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = await res.json<{ bar?: CalendarBar; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    patchBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        rows: b.rows.map((r) => ({
          ...r,
          bars: r.bars.map((bar) => (bar.id === barId ? data.bar! : bar)),
        })),
      })),
    );
  }

  async function deleteBar(barId: number) {
    const res = await fetch(`/api/admin/bars/${barId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json<{ error?: string }>();
      throw new Error(data.error ?? "Erro");
    }
    patchBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        rows: b.rows.map((r) => ({
          ...r,
          bars: r.bars.filter((bar) => bar.id !== barId),
        })),
      })),
    );
  }

  function findBlockPosition(rowId: number): number | undefined {
    for (const block of blocks) {
      for (const row of block.rows) {
        if (row.id === rowId) return block.block_position;
      }
    }
    return undefined;
  }

  function openCreate(rowId: number) {
    if (readOnly) return;
    setDialog({ open: true, mode: "create", rowId, blockPosition: findBlockPosition(rowId) });
  }

  function openEdit(rowId: number, bar: CalendarBar) {
    if (readOnly) return;
    setDialog({ open: true, mode: "edit", rowId, blockPosition: findBlockPosition(rowId), bar });
  }

  const initial: BarFormValue = dialog.bar
    ? {
        start_month:     dialog.bar.start_month,
        end_month:       dialog.bar.end_month,
        label:           dialog.bar.label ?? "",
        color:           dialog.bar.color,
        description:     dialog.bar.description ?? "",
        animal_category: dialog.bar.animal_category ?? "",
      }
    : {
        start_month:     1,
        end_month:       1,
        label:           "",
        color:           "#2BA152",
        description:     "",
        animal_category: "",
      };

  return (
    <>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="min-w-[640px] px-4 md:px-0 space-y-6">
          {blocks.map((block) => (
            <section key={block.block_position}>
              <header className="mb-2 flex items-baseline gap-3">
                <h2 className="text-base font-semibold tracking-tight">
                  {block.block_position}. {block.block_name}
                </h2>
                <span className="text-xs text-text-muted">
                  {block.rows.filter((r) => r.is_active).length} /{" "}
                  {block.rows.length} ativas
                </span>
              </header>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[200px_repeat(12,1fr)] border-b border-border bg-text/[0.02] text-xs text-text-muted">
                  <div className="px-3 py-2">Linha</div>
                  {MONTHS.map((m, i) => (
                    <div
                      key={i}
                      className="px-1 py-2 text-center border-l border-border"
                    >
                      {m}
                    </div>
                  ))}
                </div>

                {block.rows.map((row) => (
                  <div
                    key={row.id}
                    className={cn(
                      "grid grid-cols-[200px_repeat(12,1fr)] border-b border-border last:border-0 group/row",
                      !row.is_active && "opacity-50",
                    )}
                  >
                    <div className="px-3 py-2.5 text-sm flex items-center gap-2">
                      <span className="truncate flex-1">{row.row_name}</span>
                      {!readOnly && (
                        <button
                          onClick={() => toggleRow(row.id)}
                          className="text-text-muted hover:text-text"
                          title={row.is_active ? "Desativar linha" : "Ativar linha"}
                        >
                          {row.is_active ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="col-span-12 relative h-10 border-l border-border">
                      <div className="absolute inset-0 grid grid-cols-12">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (!readOnly && row.is_active) {
                                openCreate(row.id);
                                setDialog((d) => ({
                                  ...d,
                                  bar: undefined,
                                }));
                                // Pré-popular start/end com o mês clicado
                                setTimeout(() => {
                                  setDialog({
                                    open: true,
                                    mode: "create",
                                    rowId: row.id,
                                    blockPosition: block.block_position,
                                    bar: {
                                      id: 0,
                                      calendar_row_id: row.id,
                                      start_month: i + 1,
                                      end_month: i + 1,
                                      label: null,
                                      color: "#2BA152",
                                      alert: 0,
                                      position: 0,
                                      description: null,
                                      animal_category: null,
                                      created_at: "",
                                    },
                                  });
                                }, 0);
                              }
                            }}
                            disabled={readOnly || !row.is_active}
                            className={cn(
                              "border-l border-border first:border-l-0 transition-colors",
                              !readOnly &&
                                row.is_active &&
                                "hover:bg-text/[0.03] cursor-pointer",
                            )}
                            aria-label={`Adicionar barra em ${MONTHS[i]}`}
                          />
                        ))}
                      </div>

                      {row.bars.map((bar) => {
                        const startCol = bar.start_month - 1;
                        const span = bar.end_month - bar.start_month + 1;
                        const left = (startCol / 12) * 100;
                        const width = (span / 12) * 100;
                        const displayText = bar.description ?? bar.label;
                        const density = (displayText?.length ?? 0) / span;
                        const fontSize =
                          density > 8 ? "8px" :
                          density > 6 ? "9px" :
                          density > 4 ? "10px" : "11px";
                        return (
                          <button
                            key={bar.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(row.id, bar);
                            }}
                            disabled={readOnly}
                            className="absolute top-1.5 bottom-1.5 rounded-sm flex items-center justify-center px-2 font-medium overflow-hidden hover:ring-2 hover:ring-white/40 transition-all"
                            style={{
                              left: `calc(${left}% + 2px)`,
                              width: `calc(${width}% - 4px)`,
                              background: bar.color,
                              color: "rgba(0,0,0,0.85)",
                              fontSize,
                              whiteSpace: "nowrap",
                            }}
                            title={displayText ?? `Mês ${bar.start_month}-${bar.end_month}`}
                          >
                            {displayText && <span>{displayText}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {!readOnly && (
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Clique em qualquer mês de uma linha para adicionar uma barra. Clique
              em uma barra para editar ou excluir.
            </p>
          )}
        </div>
      </div>

      <BarEditorDialog
        open={dialog.open}
        mode={dialog.mode}
        initial={initial}
        blockPosition={dialog.blockPosition}
        onClose={() => setDialog({ ...dialog, open: false })}
        onSubmit={(value) =>
          dialog.mode === "create"
            ? createBar(dialog.rowId, value)
            : updateBar(dialog.bar!.id, value)
        }
        onDelete={
          dialog.mode === "edit" && dialog.bar
            ? () => deleteBar(dialog.bar!.id)
            : undefined
        }
      />
    </>
  );
}
