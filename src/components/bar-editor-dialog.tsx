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

// ─── Presets de recomendação por bloco ───────────────────────────────────────

interface Preset {
  label: string;
  description: string;
}

const PRESETS_BY_BLOCK: Record<number, Preset[]> = {
  3: [ // Vacinação
    { label: "Dose",                                     description: "Dose" },
    { label: "Dose + Reforço",                           description: "Dose + Reforço" },
    { label: "1ª Dose (30–60 dias) + Reforço (30 dias)", description: "1ª dose: 30–60 dias de vida. Reforço: 30 dias após a 1ª dose." },
    { label: "1ª Dose (60 dias) + Reforço (30 dias)",    description: "1ª dose: 60 dias de vida. Reforço: 30 dias após a 1ª dose." },
    { label: "1ª Dose (90 dias) + Reforço (30 dias)",    description: "1ª dose: 90 dias de vida. Reforço: 30 dias após a 1ª dose." },
    { label: "1ª Dose (150 dias) + Reforço (30 dias)",   description: "1ª dose: 150 dias de vida. Reforço: 30 dias após a 1ª dose." },
  ],
  4: [ // Neonato
    { label: "Cura umbigo + Probezerro + Catofós", description: "Cura umbigo + Probezerro + Catofós" },
    { label: "Prevenção de eimeriose",             description: "Prevenção de eimeriose" },
  ],
  5: [ // Vermifugação
    { label: "Dose",                           description: "Dose" },
    { label: "Dose + Reforço",                 description: "Dose + Reforço" },
    { label: "Dose + Reforço + Apartação",     description: "Dose + Reforço + Apartação" },
    { label: "Terço final gestação + Reforço", description: "Terço final gestação + Reforço" },
  ],
};

const OUTRO = "__outro__";

function localKey(blockPosition: number) {
  return `rec_custom_${blockPosition}`;
}

function loadCustomPresets(blockPosition: number): string[] {
  try {
    const raw = localStorage.getItem(localKey(blockPosition));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCustomPreset(blockPosition: number, description: string) {
  try {
    const existing = loadCustomPresets(blockPosition);
    const trimmed = description.trim();
    if (trimmed && !existing.includes(trimmed)) {
      localStorage.setItem(localKey(blockPosition), JSON.stringify([...existing, trimmed]));
    }
  } catch { /* ignore */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BarFormValue {
  start_month: number;
  end_month: number;
  label: string;
  color: string;
  description: string;
  animal_category: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial: BarFormValue;
  blockPosition?: number;
  onClose: () => void;
  onSubmit: (value: BarFormValue) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BarEditorDialog({
  open,
  mode,
  initial,
  blockPosition,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [value, setValue] = useState<BarFormValue>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recommendation, setRecommendation] = useState("");
  const [saveAsRec, setSaveAsRec] = useState(false);
  const [customPresets, setCustomPresets] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setValue(initial);
      setError(null);
      setRecommendation("");
      setSaveAsRec(false);
      if (blockPosition) {
        setCustomPresets(loadCustomPresets(blockPosition));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const builtinPresets = blockPosition ? (PRESETS_BY_BLOCK[blockPosition] ?? []) : [];
  const hasPresets = builtinPresets.length > 0 || customPresets.length > 0;

  function handleRecommendationChange(selected: string) {
    setRecommendation(selected);
    if (!selected || selected === OUTRO) return;

    if (customPresets.includes(selected)) {
      setValue((v) => ({ ...v, description: selected }));
      return;
    }

    const preset = builtinPresets.find((p) => p.label === selected);
    if (preset) {
      setValue((v) => ({ ...v, description: preset.description }));
    }
  }

  const valid = value.start_month <= value.end_month;

  async function handleSubmit() {
    if (!valid) {
      setError("Mês inicial deve ser ≤ mês final");
      return;
    }
    if (saveAsRec && blockPosition && value.description.trim()) {
      saveCustomPreset(blockPosition, value.description);
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

        {/* Período */}
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
                <option key={i} value={i + 1}>{m}</option>
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
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rótulo exibido na barra */}
        <div className="space-y-1.5">
          <Label htmlFor="bar-label">Rótulo da barra</Label>
          <Input
            id="bar-label"
            value={value.label}
            onChange={(e) => setValue({ ...value, label: e.target.value })}
            placeholder="Ex.: Clostridiose (1ª dose)"
          />
        </div>

        {/* Recomendação (presets por bloco) */}
        {hasPresets && (
          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor="bar-recommendation">Recomendação</Label>
              <select
                id="bar-recommendation"
                value={recommendation}
                onChange={(e) => handleRecommendationChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus-visible:outline-none focus-visible:border-text-muted"
              >
                <option value="">Selecionar recomendação...</option>
                {customPresets.length > 0 && (
                  <optgroup label="Salvas">
                    {customPresets.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Padrão">
                  {builtinPresets.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </optgroup>
                <option value={OUTRO}>Outro</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsRec}
                onChange={(e) => setSaveAsRec(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border bg-bg"
              />
              <span>Salvar como recomendação</span>
            </label>
          </div>
        )}

        {/* Descrição técnica */}
        <div className="space-y-1.5">
          <Label htmlFor="bar-description">
            Descrição técnica
            <span className="ml-1 text-text-muted text-xs font-normal">(recomendada)</span>
          </Label>
          <textarea
            id="bar-description"
            rows={3}
            value={value.description}
            onChange={(e) => setValue({ ...value, description: e.target.value })}
            placeholder="Ex.: Vacinar SC, 2 mL/animal. Revacinação 21 dias após a 1ª dose em cordeiros."
            className="flex w-full rounded-md border border-border bg-bg px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:border-text-muted placeholder:text-text-muted/50"
          />
        </div>

        {/* Categoria animal */}
        <div className="space-y-1.5">
          <Label htmlFor="bar-category">
            Categoria animal
            <span className="ml-1 text-text-muted text-xs font-normal">(opcional)</span>
          </Label>
          <Input
            id="bar-category"
            value={value.animal_category}
            onChange={(e) => setValue({ ...value, animal_category: e.target.value })}
            placeholder="Ex.: Cordeiros, Matrizes, Adultos, Reprodutores"
          />
        </div>

        {/* Cor */}
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
