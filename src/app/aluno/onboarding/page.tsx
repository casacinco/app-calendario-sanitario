"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

interface FormState {
  user: { email: string; name: string };
  farm: { name: string; city: string; state: string; notes: string };
  flock: {
    species: string;
    total_animals: string;
    housing_type: string;
    age_groups: string;
  };
  questionnaire: {
    vaccination_history: string;
    current_medications: string;
    recent_diseases: string;
    biosecurity_practices: string;
    water_source: string;
    feed_source: string;
    veterinary_assistance: string;
    additional_info: string;
  };
}

const initialState: FormState = {
  user: { email: "", name: "" },
  farm: { name: "", city: "", state: "", notes: "" },
  flock: { species: "Aves", total_animals: "", housing_type: "", age_groups: "" },
  questionnaire: {
    vaccination_history: "",
    current_medications: "",
    recent_diseases: "",
    biosecurity_practices: "",
    water_source: "",
    feed_source: "",
    veterinary_assistance: "",
    additional_info: "",
  },
};

const steps = [
  { id: 1, label: "Identificação" },
  { id: 2, label: "Propriedade" },
  { id: 3, label: "Rebanho" },
  { id: 4, label: "Sanitário" },
] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ requestId: number } | null>(null);

  function update<K extends keyof FormState>(
    section: K,
    patch: Partial<FormState[K]>,
  ) {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  }

  function isStepValid(s: Step): boolean {
    if (s === 1) return form.user.email.trim() !== "" && form.user.name.trim() !== "";
    if (s === 2) return form.farm.name.trim() !== "";
    if (s === 3) return form.flock.species.trim() !== "";
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: form.user,
          farm: {
            name: form.farm.name,
            city: form.farm.city || undefined,
            state: form.farm.state || undefined,
            notes: form.farm.notes || undefined,
          },
          flock: {
            species: form.flock.species,
            total_animals: form.flock.total_animals
              ? Number(form.flock.total_animals)
              : undefined,
            housing_type: form.flock.housing_type || undefined,
            age_groups: form.flock.age_groups || undefined,
          },
          questionnaire: form.questionnaire,
        }),
      });
      const data = await res.json<{
        request?: { id: number };
        error?: string;
      }>();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      setSuccess({ requestId: data.request!.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="h-10 w-10 rounded-full bg-green/15 flex items-center justify-center mb-3">
              <Check className="h-5 w-5 text-green" />
            </div>
            <CardTitle>Solicitação enviada</CardTitle>
            <CardDescription>
              Recebemos sua solicitação #{success.requestId}. A equipe técnica
              vai analisar os dados e produzir seu calendário sanitário.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Nova solicitação</h1>
        <p className="text-text-muted text-sm mt-1">
          Preencha as etapas para gerarmos seu calendário.
        </p>
      </header>

      {/* Progress */}
      <ol className="flex gap-2">
        {steps.map((s) => (
          <li key={s.id} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                s.id <= step ? "bg-text" : "bg-border",
              )}
            />
            <p
              className={cn(
                "mt-2 text-xs",
                s.id === step ? "text-text font-medium" : "text-text-muted",
              )}
            >
              {s.id}. {s.label}
            </p>
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={form.user.name}
                  onChange={(e) => update("user", { name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.user.email}
                  onChange={(e) => update("user", { email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="farm-name">Nome da propriedade *</Label>
                <Input
                  id="farm-name"
                  value={form.farm.name}
                  onChange={(e) => update("farm", { name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={form.farm.city}
                    onChange={(e) => update("farm", { city: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={form.farm.state}
                    onChange={(e) => update("farm", { state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farm-notes">Observações</Label>
                <Textarea
                  id="farm-notes"
                  value={form.farm.notes}
                  onChange={(e) => update("farm", { notes: e.target.value })}
                  placeholder="Localização, área, particularidades…"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="species">Espécie *</Label>
                <Input
                  id="species"
                  value={form.flock.species}
                  onChange={(e) => update("flock", { species: e.target.value })}
                  placeholder="Ex.: Aves de postura, frangos de corte"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="total">Total de animais</Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    value={form.flock.total_animals}
                    onChange={(e) =>
                      update("flock", { total_animals: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="housing">Tipo de alojamento</Label>
                  <Input
                    id="housing"
                    value={form.flock.housing_type}
                    onChange={(e) =>
                      update("flock", { housing_type: e.target.value })
                    }
                    placeholder="Galpão, pasto, …"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ages">Categorias / lotes</Label>
                <Textarea
                  id="ages"
                  value={form.flock.age_groups}
                  onChange={(e) =>
                    update("flock", { age_groups: e.target.value })
                  }
                  placeholder="Ex.: 500 matrizes, 2000 frangos 1-21 dias…"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="vacc">Histórico de vacinação</Label>
                <Textarea
                  id="vacc"
                  value={form.questionnaire.vaccination_history}
                  onChange={(e) =>
                    update("questionnaire", {
                      vaccination_history: e.target.value,
                    })
                  }
                  placeholder="Vacinas aplicadas e datas"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meds">Medicamentos em uso</Label>
                <Textarea
                  id="meds"
                  value={form.questionnaire.current_medications}
                  onChange={(e) =>
                    update("questionnaire", {
                      current_medications: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diseases">Doenças recentes</Label>
                <Textarea
                  id="diseases"
                  value={form.questionnaire.recent_diseases}
                  onChange={(e) =>
                    update("questionnaire", {
                      recent_diseases: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="water">Fonte de água</Label>
                  <Input
                    id="water"
                    value={form.questionnaire.water_source}
                    onChange={(e) =>
                      update("questionnaire", { water_source: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="feed">Fonte de ração</Label>
                  <Input
                    id="feed"
                    value={form.questionnaire.feed_source}
                    onChange={(e) =>
                      update("questionnaire", { feed_source: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vet">Assistência veterinária</Label>
                <Input
                  id="vet"
                  value={form.questionnaire.veterinary_assistance}
                  onChange={(e) =>
                    update("questionnaire", {
                      veterinary_assistance: e.target.value,
                    })
                  }
                  placeholder="Veterinário responsável, frequência…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Biossegurança</Label>
                <Textarea
                  id="bio"
                  value={form.questionnaire.biosecurity_practices}
                  onChange={(e) =>
                    update("questionnaire", {
                      biosecurity_practices: e.target.value,
                    })
                  }
                  placeholder="Limpeza, desinfecção, controle de acesso…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="more">Informações adicionais</Label>
                <Textarea
                  id="more"
                  value={form.questionnaire.additional_info}
                  onChange={(e) =>
                    update("questionnaire", {
                      additional_info: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red border border-red/30 bg-red/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => (s - 1) as Step)}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!isStepValid(step)}
          >
            Avançar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={submitting || !isStepValid(step)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Enviar solicitação
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
