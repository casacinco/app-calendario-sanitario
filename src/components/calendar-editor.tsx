"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { CalendarBar, CalendarBlockGroup, CalendarRow } from "@/lib/db";
import { cn } from "@/lib/utils";
import { BarEditorDialog, type BarFormValue } from "@/components/bar-editor-dialog";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const SEP = /^(.+?)\s*—\s*(.+)$/;

// ─── Agrupamento visual por doença ───────────────────────────────────────────

type CalendarRowWithBars = CalendarRow & { bars: CalendarBar[] };

type RowGroup =
  | { type: "single"; row: CalendarRowWithBars }
  | { type: "group"; disease: string; rows: CalendarRowWithBars[] };

function groupRows(rows: CalendarRowWithBars[]): RowGroup[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const m = row.row_name.match(SEP);
    if (m) counts.set(m[1]!.trim(), (counts.get(m[1]!.trim()) ?? 0) + 1);
  }

  const result: RowGroup[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const m = row.row_name.match(SEP);
    if (m && (counts.get(m[1]!.trim()) ?? 0) > 1) {
      const disease = m[1]!.trim();
      if (!seen.has(disease)) {
        seen.add(disease);
        result.push({
          type: "group",
          disease,
          rows: rows.filter((r) => {
            const rm = r.row_name.match(SEP);
            return rm && rm[1]!.trim() === disease;
          }),
        });
      }
    } else {
      result.push({ type: "single", row });
    }
  }
  return result;
}

function categoryName(rowName: string): string {
  const m = rowName.match(SEP);
  return m ? m[2]!.trim() : rowName;
}

// ─── Shared grid classes ──────────────────────────────────────────────────────

// Column 1 is wider to show full names without truncation
const GRID = "grid grid-cols-[220px_repeat(12,1fr)]";

interface DialogState {
  open: boolean;
  mode: "create" | "edit";
  rowId: number;
  blockPosition?: number;
  bar?: CalendarBar;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarEditor({
  initialBlocks,
  readOnly = false,
  calendarId,
}: {
  initialBlocks: CalendarBlockGroup[];
  readOnly?: boolean;
  calendarId?: number;
}) {
  const [blocks, setBlocks] = useState<CalendarBlockGroup[]>(initialBlocks);
  const [dialog, setDialog] = useState<DialogState>({ open: false, mode: "create", rowId: 0 });

  const [editingRow, setEditingRow]     = useState<{ id: number; name: string } | null>(null);
  const [editingBlock, setEditingBlock] = useState<{ position: number; name: string } | null>(null);
  const [newRowState, setNewRowState]   = useState<{ blockPosition: number; blockName: string; value: string } | null>(null);
  const [newBlockName, setNewBlockName] = useState<string | null>(null);

  const canEdit = !readOnly && !!calendarId;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function patchBlocks(updater: (b: CalendarBlockGroup[]) => CalendarBlockGroup[]) {
    setBlocks((prev) => updater(prev));
  }

  function findBlockPosition(rowId: number): number | undefined {
    for (const block of blocks) {
      for (const row of block.rows) {
        if (row.id === rowId) return block.block_position;
      }
    }
    return undefined;
  }

  // ─── Bar mutations ──────────────────────────────────────────────────────────

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

  // ─── Row mutations ──────────────────────────────────────────────────────────

  async function createRow(blockPosition: number, blockName: string, rowName: string) {
    const existingBlock = blocks.find((b) => b.block_position === blockPosition);
    const rowPosition =
      (existingBlock?.rows.reduce((m, r) => Math.max(m, r.row_position), 0) ?? 0) + 1;

    const res = await fetch("/api/admin/rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calendar_id: calendarId,
        block_name: blockName,
        block_position: blockPosition,
        row_name: rowName,
        row_position: rowPosition,
      }),
    });
    const data = await res.json<{ row?: CalendarRow; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");

    const newRow: CalendarRowWithBars = { ...data.row!, bars: [] };
    patchBlocks((prev) => {
      const exists = prev.some((b) => b.block_position === blockPosition);
      if (exists) {
        return prev.map((b) =>
          b.block_position === blockPosition ? { ...b, rows: [...b.rows, newRow] } : b,
        );
      }
      return [...prev, { block_name: blockName, block_position: blockPosition, rows: [newRow] }].sort(
        (a, b) => a.block_position - b.block_position,
      );
    });
  }

  async function renameRow(rowId: number, newName: string) {
    const res = await fetch(`/api/admin/rows/${rowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json<{ row?: CalendarRow; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    patchBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        rows: b.rows.map((r) =>
          r.id === rowId ? { ...r, row_name: data.row!.row_name } : r,
        ),
      })),
    );
  }

  async function doDeleteRow(rowId: number) {
    if (!window.confirm("Remover este manejo? As barras associadas também serão removidas.")) return;
    const res = await fetch(`/api/admin/rows/${rowId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json<{ error?: string }>();
      throw new Error(data.error ?? "Erro");
    }
    patchBlocks((prev) =>
      prev
        .map((b) => ({ ...b, rows: b.rows.filter((r) => r.id !== rowId) }))
        .filter((b) => b.rows.length > 0),
    );
  }

  // ─── Block mutations ────────────────────────────────────────────────────────

  async function renameBlock(blockPosition: number, newName: string) {
    const res = await fetch(`/api/admin/calendars/${calendarId}/blocks/${blockPosition}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
      const data = await res.json<{ error?: string }>();
      throw new Error(data.error ?? "Erro");
    }
    patchBlocks((prev) =>
      prev.map((b) =>
        b.block_position === blockPosition ? { ...b, block_name: newName } : b,
      ),
    );
  }

  async function doDeleteBlock(blockPosition: number) {
    const block = blocks.find((b) => b.block_position === blockPosition);
    if (!block) return;
    if (
      !window.confirm(
        `Remover o bloco "${block.block_name}"? Todos os manejos e barras serão removidos.`,
      )
    )
      return;

    if (block.rows.length === 0) {
      patchBlocks((prev) => prev.filter((b) => b.block_position !== blockPosition));
      return;
    }

    const res = await fetch(
      `/api/admin/calendars/${calendarId}/blocks/${blockPosition}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json<{ error?: string }>();
      throw new Error(data.error ?? "Erro");
    }
    patchBlocks((prev) => prev.filter((b) => b.block_position !== blockPosition));
  }

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

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

  // ─── Inline submit helpers ──────────────────────────────────────────────────

  function submitEditRow() {
    if (!editingRow?.name.trim()) { setEditingRow(null); return; }
    renameRow(editingRow.id, editingRow.name.trim()).catch(() => null);
    setEditingRow(null);
  }

  function submitEditBlock() {
    if (!editingBlock?.name.trim()) { setEditingBlock(null); return; }
    renameBlock(editingBlock.position, editingBlock.name.trim()).catch(() => null);
    setEditingBlock(null);
  }

  function submitNewRow() {
    if (!newRowState?.value.trim()) { setNewRowState(null); return; }
    createRow(newRowState.blockPosition, newRowState.blockName, newRowState.value.trim()).catch(() => null);
    setNewRowState(null);
  }

  function submitNewBlock() {
    if (!newBlockName?.trim()) { setNewBlockName(null); return; }
    const name = newBlockName.trim();
    const newPos = blocks.reduce((m, b) => Math.max(m, b.block_position), 0) + 1;
    patchBlocks((prev) => [...prev, { block_name: name, block_position: newPos, rows: [] }]);
    setNewBlockName(null);
    setNewRowState({ blockPosition: newPos, blockName: name, value: "" });
  }

  // ─── Row cell renderers ─────────────────────────────────────────────────────

  function renderMonthGrid(row: CalendarRowWithBars, blockPosition: number) {
    return (
      <div className="col-span-12 relative min-h-10 border-l border-border">
        <div className="absolute inset-0 grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!readOnly && row.is_active) {
                  openCreate(row.id);
                  setDialog((d) => ({ ...d, bar: undefined }));
                  setTimeout(() => {
                    setDialog({
                      open: true,
                      mode: "create",
                      rowId: row.id,
                      blockPosition,
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
                !readOnly && row.is_active && "hover:bg-text/[0.03] cursor-pointer",
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
              onClick={(e) => { e.stopPropagation(); openEdit(row.id, bar); }}
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
    );
  }

  function renderRowNameCell(row: CalendarRowWithBars, displayName: string, indent = false) {
    return (
      <div
        className={cn(
          "py-2.5 text-sm flex items-center gap-1.5",
          indent ? "pl-7 pr-3" : "px-3",
        )}
      >
        {canEdit && editingRow?.id === row.id ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              autoFocus
              value={editingRow.name}
              onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEditRow();
                if (e.key === "Escape") setEditingRow(null);
              }}
              className="text-sm bg-bg border border-border rounded px-1.5 py-0.5 focus:outline-none focus:border-text-muted w-full"
            />
            <button onClick={submitEditRow} className="text-green hover:opacity-80 shrink-0">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setEditingRow(null)} className="text-text-muted hover:text-text shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 leading-snug">{displayName}</span>
            {!readOnly && (
              <button
                onClick={() => toggleRow(row.id)}
                className="text-text-muted hover:text-text shrink-0"
                title={row.is_active ? "Desativar linha" : "Ativar linha"}
              >
                {row.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => setEditingRow({ id: row.id, name: row.row_name })}
                  className="text-text-muted hover:text-text shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  title="Renomear"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => doDeleteRow(row.id).catch(() => null)}
                  className="text-text-muted hover:text-red shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="min-w-[680px] px-4 md:px-0 space-y-6">

          {blocks.map((block) => {
            const grouped = groupRows(block.rows as CalendarRowWithBars[]);

            return (
              <section key={block.block_position}>

                {/* Block header */}
                <header className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3 min-w-0">
                    {canEdit && editingBlock?.position === block.block_position ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editingBlock.name}
                          onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitEditBlock();
                            if (e.key === "Escape") setEditingBlock(null);
                          }}
                          className="text-base font-semibold bg-bg border border-border rounded px-2 py-0.5 focus:outline-none focus:border-text-muted w-48"
                        />
                        <button onClick={submitEditBlock} className="text-green hover:opacity-80">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingBlock(null)} className="text-text-muted hover:text-text">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <h2 className="text-base font-semibold tracking-tight">
                        {block.block_position}. {block.block_name}
                      </h2>
                    )}
                    <span className="text-xs text-text-muted shrink-0">
                      {block.rows.filter((r) => r.is_active).length} / {block.rows.length} ativas
                    </span>
                  </div>

                  {canEdit && editingBlock?.position !== block.block_position && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingBlock({ position: block.block_position, name: block.block_name })}
                        className="text-text-muted hover:text-text p-1"
                        title="Renomear bloco"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => doDeleteBlock(block.block_position).catch(() => null)}
                        className="text-text-muted hover:text-red p-1"
                        title="Remover bloco"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </header>

                <div className="rounded-lg border border-border bg-card overflow-hidden">

                  {/* Month header */}
                  <div className={cn(GRID, "border-b border-border bg-text/[0.02] text-xs text-text-muted")}>
                    <div className="px-3 py-2">Linha</div>
                    {MONTHS.map((m, i) => (
                      <div key={i} className="px-1 py-2 text-center border-l border-border">{m}</div>
                    ))}
                  </div>

                  {/* Rows (grouped) */}
                  <div className="divide-y divide-border">
                    {grouped.map((group) => {
                      if (group.type === "single") {
                        const row = group.row;
                        return (
                          <div
                            key={row.id}
                            className={cn(
                              GRID,
                              "group/row",
                              !row.is_active && "opacity-50",
                            )}
                          >
                            {renderRowNameCell(row, row.row_name)}
                            {renderMonthGrid(row, block.block_position)}
                          </div>
                        );
                      }

                      // Grouped: disease header + sub-rows
                      return (
                        <div key={group.disease}>
                          {/* Disease header */}
                          <div className={cn(GRID, "bg-text/[0.03] divide-y divide-border/60")}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-text-muted tracking-wide flex items-center gap-2">
                              <span className="w-0.5 h-3 rounded-full bg-border inline-block shrink-0" />
                              {group.disease}
                            </div>
                            <div className="col-span-12 border-l border-border/40" />
                          </div>

                          {/* Sub-rows */}
                          <div className="divide-y divide-border">
                            {group.rows.map((row) => (
                              <div
                                key={row.id}
                                className={cn(GRID, "group/row", !row.is_active && "opacity-50")}
                              >
                                {renderRowNameCell(row, categoryName(row.row_name), true)}
                                {renderMonthGrid(row, block.block_position)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* New row input */}
                    {canEdit && newRowState?.blockPosition === block.block_position && (
                      <div className={cn(GRID, "bg-text/[0.02]")}>
                        <div className="px-3 py-2 flex items-center gap-1.5">
                          <input
                            autoFocus
                            value={newRowState.value}
                            onChange={(e) => setNewRowState({ ...newRowState, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitNewRow();
                              if (e.key === "Escape") setNewRowState(null);
                            }}
                            placeholder="Nome do manejo..."
                            className="text-sm bg-bg border border-border rounded px-2 py-1 focus:outline-none focus:border-text-muted flex-1 min-w-0"
                          />
                          <button onClick={submitNewRow} className="text-green hover:opacity-80 shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setNewRowState(null)} className="text-text-muted hover:text-text shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="col-span-12 border-l border-border" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Add row button */}
                {canEdit && newRowState?.blockPosition !== block.block_position && (
                  <button
                    onClick={() => setNewRowState({ blockPosition: block.block_position, blockName: block.block_name, value: "" })}
                    className="mt-1.5 text-xs text-text-muted hover:text-text flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Adicionar manejo
                  </button>
                )}
              </section>
            );
          })}

          {/* New block name input */}
          {canEdit && newBlockName !== null && (
            <section>
              <header className="mb-2 flex items-center gap-2">
                <input
                  autoFocus
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNewBlock();
                    if (e.key === "Escape") setNewBlockName(null);
                  }}
                  placeholder="Nome do bloco..."
                  className="text-base font-semibold bg-bg border border-border rounded px-2 py-0.5 focus:outline-none focus:border-text-muted w-56"
                />
                <button onClick={submitNewBlock} className="text-green hover:opacity-80">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setNewBlockName(null)} className="text-text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </header>
            </section>
          )}

          {/* Bottom actions */}
          <div className={cn("flex items-center", canEdit ? "justify-between" : "justify-start")}>
            {!readOnly && (
              <p className="text-xs text-text-muted flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Clique em qualquer mês para adicionar uma barra. Clique em uma barra para editar ou excluir.
              </p>
            )}
            {canEdit && newBlockName === null && (
              <button
                onClick={() => setNewBlockName("")}
                className="text-xs text-text-muted hover:text-text flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar bloco
              </button>
            )}
          </div>

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
