"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { CalendarBar, CalendarBlockGroup, CalendarBlockNote, CalendarRow } from "@/lib/db";
import { cn } from "@/lib/utils";
import { BarEditorDialog, type BarFormValue, type BarPart } from "@/components/bar-editor-dialog";
import { rowColor } from "@/lib/row-colors";
import { PRESETS } from "@/lib/presets";

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

  const [editingNote, setEditingNote] = useState<{ id: number; text: string } | null>(null);
  const [newNote, setNewNote]         = useState<{ blockPos: number; text: string } | null>(null);

  const [applyingPreset, setApplyingPreset] = useState(false);

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

  function findRowInfo(rowId: number): { rowName: string; blockName: string } | null {
    for (const block of blocks) {
      const row = block.rows.find((r) => r.id === rowId);
      if (row) return { rowName: row.row_name, blockName: block.block_name };
    }
    return null;
  }

  function findRowByName(rowName: string): CalendarRowWithBars | null {
    for (const block of blocks) {
      const row = (block.rows as CalendarRowWithBars[]).find((r) => r.row_name === rowName);
      if (row) return row;
    }
    return null;
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

  // ─── Note mutations ────────────────────────────────────────────────────────

  function patchNotes(updater: (notes: CalendarBlockNote[], blockPos: number) => CalendarBlockNote[]) {
    setBlocks((prev) =>
      prev.map((b) => ({ ...b, notes: updater(b.notes ?? [], b.block_position) })),
    );
  }

  async function createNote(blockPos: number, text: string) {
    const block = blocks.find((b) => b.block_position === blockPos);
    const maxPos = (block?.notes ?? []).reduce((m, n) => Math.max(m, n.position), 0);
    const res = await fetch(`/api/admin/calendars/${calendarId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ block_position: blockPos, text, position: maxPos + 1 }),
    });
    const data = await res.json<{ note?: CalendarBlockNote; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    setBlocks((prev) =>
      prev.map((b) =>
        b.block_position === blockPos
          ? { ...b, notes: [...(b.notes ?? []), data.note!] }
          : b,
      ),
    );
  }

  async function updateNote(noteId: number, patch: { text?: string; is_visible?: number }) {
    const res = await fetch(`/api/admin/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json<{ note?: CalendarBlockNote; error?: string }>();
    if (!res.ok) throw new Error(data.error ?? "Erro");
    const updated = data.note!;
    patchNotes((notes) => notes.map((n) => (n.id === updated.id ? updated : n)));
  }

  async function doDeleteNote(noteId: number) {
    if (!window.confirm("Remover esta observação?")) return;
    const res = await fetch(`/api/admin/notes/${noteId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json<{ error?: string }>();
      throw new Error(data.error ?? "Erro");
    }
    patchNotes((notes) => notes.filter((n) => n.id !== noteId));
  }

  function submitNewNote() {
    if (!newNote?.text.trim()) { setNewNote(null); return; }
    createNote(newNote.blockPos, newNote.text.trim()).catch(() => null);
    setNewNote(null);
  }

  function submitEditNote() {
    if (!editingNote?.text.trim()) { setEditingNote(null); return; }
    updateNote(editingNote.id, { text: editingNote.text.trim() }).catch(() => null);
    setEditingNote(null);
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
        start_part:      (dialog.bar.start_part ?? "start") as BarFormValue["start_part"],
        end_part:        (dialog.bar.end_part   ?? "end")   as BarFormValue["end_part"],
        label:           dialog.bar.label ?? "",
        color:           dialog.bar.color,
        description:     dialog.bar.description ?? "",
        animal_category: dialog.bar.animal_category ?? "",
      }
    : {
        start_month:     1,
        end_month:       1,
        start_part:      "start",
        end_part:        "end",
        label:           "",
        color:           (() => {
          const info = findRowInfo(dialog.rowId);
          return info ? rowColor(info.rowName, info.blockName).bg : "#4F4F4F";
        })(),
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

  async function applyPreset(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset || !calendarId) return;
    if (!window.confirm(`Aplicar o modelo "${preset.name}"?\n\nTodas as barras atuais serão removidas e substituídas pelas barras do modelo.`)) return;

    setApplyingPreset(true);
    try {
      // 1. Apagar todas as barras
      await fetch(`/api/admin/calendars/${calendarId}/bars`, { method: "DELETE" });
      patchBlocks((prev) => prev.map((b) => ({
        ...b,
        rows: b.rows.map((r) => ({ ...r, bars: [] })),
      })));

      // 2. Criar barras do preset sequencialmente
      for (const pb of preset.bars) {
        const row = findRowByName(pb.rowName);
        if (!row) continue;
        await createBar(row.id, {
          start_month:     pb.startMonth,
          end_month:       pb.endMonth,
          start_part:      "start",
          end_part:        "end",
          label:           pb.label,
          color:           pb.color,
          description:     pb.label,
          animal_category: "",
        });
      }
    } finally {
      setApplyingPreset(false);
    }
  }

  // ─── Row cell renderers ─────────────────────────────────────────────────────

  function renderMonthGrid(row: CalendarRowWithBars, blockPosition: number, blockName: string) {
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
                        start_part: "start",
                        end_part: "end",
                        label: null,
                        color: rowColor(row.row_name, blockName).bg,
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
          const PART_LEFT:  Record<BarPart, number> = { start: 0, middle: 1/3, end: 2/3 };
          const PART_RIGHT: Record<BarPart, number> = { start: 1/3, middle: 2/3, end: 1 };
          const sp = (bar.start_part ?? "start") as BarPart;
          const ep = (bar.end_part   ?? "end")   as BarPart;
          const leftFrac  = (bar.start_month - 1 + PART_LEFT[sp])  / 12;
          const rightFrac = (bar.end_month   - 1 + PART_RIGHT[ep]) / 12;
          const left  = leftFrac  * 100;
          const width = (rightFrac - leftFrac) * 100;
          const displayText = bar.description ?? bar.label;
          const span = rightFrac - leftFrac; // fraction of 12 months, for density
          const density = (displayText?.length ?? 0) / Math.max(span * 12, 0.1);
          const fontSize =
            density > 20 ? "5px" :
            density > 14 ? "6px" :
            density > 10 ? "7px" :
            density > 8  ? "8px" :
            density > 6  ? "9px" :
            density > 4  ? "10px" : "11px";
          return (
            <button
              key={bar.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); openEdit(row.id, bar); }}
              disabled={readOnly}
              className="absolute top-1.5 bottom-1.5 rounded-sm flex items-center justify-center px-1 font-medium hover:ring-2 hover:ring-white/40 transition-all z-10"
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
      {/* Seletor de modelo de calendário */}
      {canEdit && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-text whitespace-nowrap">
            Selecionar modelo de calendário
          </label>
          <select
            defaultValue=""
            disabled={applyingPreset}
            onChange={(e) => {
              if (e.target.value) {
                applyPreset(e.target.value).catch(() => null);
                e.target.value = "";
              }
            }}
            className="flex-1 min-w-[200px] h-9 rounded-md border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:border-text-muted disabled:opacity-50"
          >
            <option value="">Selecionar modelo...</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {applyingPreset && (
            <span className="text-xs text-text-muted animate-pulse">Aplicando modelo...</span>
          )}
        </div>
      )}

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
                            {renderMonthGrid(row, block.block_position, block.block_name)}
                          </div>
                        );
                      }

                      // Grouped: disease cell spans height via flex, category sub-rows beside it
                      // disease(100px) + category(120px) = 220px = single-row name col → month cols align
                      return (
                        <div key={group.disease} className="flex">
                          {/* Disease name — single merged cell spanning all sub-rows */}
                          <div className="w-[100px] shrink-0 flex items-center justify-center px-2 py-2 border-r border-border">
                            <span className="text-xs font-medium text-text leading-snug text-center">
                              {group.disease}
                            </span>
                          </div>

                          {/* Category sub-rows */}
                          <div className="flex-1 min-w-0 divide-y divide-border">
                            {group.rows.map((row) => (
                              <div
                                key={row.id}
                                className={cn(
                                  "grid grid-cols-[120px_repeat(12,1fr)] group/row",
                                  !row.is_active && "opacity-50",
                                )}
                              >
                                {renderRowNameCell(row, categoryName(row.row_name))}
                                {renderMonthGrid(row, block.block_position, block.block_name)}
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

                  {/* Observações do bloco */}
                  {(() => {
                    const visibleNotes = canEdit
                      ? (block.notes ?? [])
                      : (block.notes ?? []).filter((n) => n.is_visible === 1);
                    if (visibleNotes.length === 0 && !canEdit) return null;
                    return (
                      <div className="border-t border-border px-4 py-3 space-y-2.5">
                        <p className="text-xs font-medium text-text-muted">
                          Observações do bloco
                        </p>
                        <div className="space-y-1.5">
                          {visibleNotes.map((note) => (
                            <div key={note.id} className="flex items-start gap-2 group/note">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => updateNote(note.id, { is_visible: note.is_visible === 1 ? 0 : 1 }).catch(() => null)}
                                  className={cn(
                                    "mt-0.5 shrink-0 transition-colors",
                                    note.is_visible ? "text-text-muted hover:text-text" : "text-text-muted/30 hover:text-text-muted",
                                  )}
                                  title={note.is_visible ? "Ocultar do cliente" : "Mostrar ao cliente"}
                                >
                                  {note.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                              )}

                              {canEdit && editingNote?.id === note.id ? (
                                <div className="flex items-start gap-1 flex-1">
                                  <textarea
                                    autoFocus
                                    rows={3}
                                    value={editingNote.text}
                                    onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") setEditingNote(null);
                                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitEditNote();
                                    }}
                                    className="flex-1 text-xs bg-bg border border-border rounded px-2 py-1 resize-none focus:outline-none focus:border-text-muted"
                                  />
                                  <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                    <button type="button" onClick={submitEditNote} className="text-green hover:opacity-80">
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button" onClick={() => setEditingNote(null)} className="text-text-muted hover:text-text">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className={cn(
                                    "flex-1 text-xs leading-relaxed",
                                    note.is_visible ? "text-text" : "text-text-muted/40",
                                  )}>
                                    {note.text}
                                  </p>
                                  {canEdit && (
                                    <div className="flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0 mt-0.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditingNote({ id: note.id, text: note.text })}
                                        className="text-text-muted hover:text-text"
                                        title="Editar"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => doDeleteNote(note.id).catch(() => null)}
                                        className="text-text-muted hover:text-red"
                                        title="Remover"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        {canEdit && (
                          newNote?.blockPos === block.block_position ? (
                            <div className="flex items-start gap-1.5">
                              <textarea
                                autoFocus
                                rows={2}
                                value={newNote.text}
                                onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") setNewNote(null);
                                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitNewNote();
                                }}
                                placeholder="Texto da observação..."
                                className="flex-1 text-xs bg-bg border border-border rounded px-2 py-1 resize-none focus:outline-none focus:border-text-muted"
                              />
                              <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                <button type="button" onClick={submitNewNote} className="text-green hover:opacity-80">
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => setNewNote(null)} className="text-text-muted hover:text-text">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setNewNote({ blockPos: block.block_position, text: "" })}
                              className="text-xs text-text-muted hover:text-text flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Adicionar observação
                            </button>
                          )
                        )}
                      </div>
                    );
                  })()}
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
