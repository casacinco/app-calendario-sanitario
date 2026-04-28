"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = [
  "#2BA152", // verde
  "#FF2B2B", // vermelho
  "#3B82F6", // azul
  "#F59E0B", // âmbar
  "#8B5CF6", // roxo
  "#EC4899", // pink
  "#06B6D4", // ciano
  "#9CA3AF", // cinza
];

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export interface BarFormValue {
  start_month: number;
  end_month: number;
  label: string;
  color: string;
  alert: boolean;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial: BarFormValue;
  onClose: () => void;
  onSubmit: (value: BarFormValue) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export function BarEditorDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [value, setValue] = useState<BarFormValue>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initial);
      setError(null);
    }
  }, [open, initial]);

  const valid = value.start_month <= value.end_month;

  async function handleSubmit() {
    if (!valid) {
      setError("Mês inicial deve ser ≤ mês final");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Adicionar barra" : "Editar barra"}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bar-label">Descrição</Label>
          <Input
            id="bar-label"
            value={value.label}
            onChange={(e) => setValue({ ...value, label: e.target.value })}
            placeholder="Ex.: Newcastle (1ª dose)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bar-start">Mês inicial</Label>
            <select
              id="bar-start"
              value={value.start_month}
              onChange={(e) =>
                setValue({ ...value, start_month: Number(e.target.value) })
              }
              className="flex h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:border-text-muted"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bar-end">Mês final</Label>
            <select
              id="bar-end"
              value={value.end_month}
              onChange={(e) =>
                setValue({ ...value, end_month: Number(e.target.value) })
              }
              className="flex h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:border-text-muted"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue({ ...value, color: c })}
                className="h-8 w-8 rounded-md border-2 transition-all"
                style={{
                  background: c,
                  borderColor: value.color === c ? "white" : "transparent",
                }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={value.alert}
            onChange={(e) => setValue({ ...value, alert: e.target.checked })}
            className="h-4 w-4 rounded border-border bg-bg accent-red"
          />
          <span>Marcar como alerta crítico</span>
        </label>

        {error && (
          <p className="text-sm text-red border border-red/30 bg-red/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          {mode === "edit" && onDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={submitting}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !valid}>
              {mode === "create" ? "Adicionar" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
