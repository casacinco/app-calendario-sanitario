"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";

interface FormState {
  owner_name:  string;
  farm_name:   string;
  state:       string;
  city:        string;
  notes:       string;
}

const FIELD = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors";

export function MigrationForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    owner_name: userName,
    farm_name:  "",
    state:      "",
    city:       "",
    notes:      "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.owner_name.trim() || !form.farm_name.trim() || !form.city.trim() || !form.state.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/migration", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json<{ error?: string }>();
        throw new Error(json.error ?? "Erro ao enviar dados.");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs font-medium text-blue-400">
            Migração de Calendário
          </div>
          <h1 className="text-2xl font-bold text-white leading-snug">
            Transferir meu calendário para o aplicativo
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Nossa equipe irá localizar e transcrever o seu calendário sanitário existente.
            Preencha apenas as informações básicas da sua propriedade.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Nome do proprietário <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.owner_name}
              onChange={(e) => set("owner_name", e.target.value)}
              placeholder="Seu nome completo"
              className={FIELD}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Nome da fazenda / cabanha <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.farm_name}
              onChange={(e) => set("farm_name", e.target.value)}
              placeholder="Ex: Fazenda São João"
              className={FIELD}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Estado <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Ex: SP"
                maxLength={2}
                className={FIELD + " uppercase"}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Cidade <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Ex: Ribeirão Preto"
                className={FIELD}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Observações <span className="text-white/25">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Informações adicionais que possam ajudar nossa equipe a localizar o seu calendário…"
              rows={3}
              className={FIELD + " resize-none"}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[hsl(var(--green))] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Enviar solicitação de migração
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Reassurance */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Como funciona</p>
          <ul className="space-y-1.5">
            {[
              "Nossa equipe localiza o PDF do seu calendário existente",
              "O calendário é transcrito e publicado no aplicativo",
              "Você recebe acesso ao seu calendário digitalizado",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/40">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
