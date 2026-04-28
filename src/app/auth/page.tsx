"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const filled = value.length > 0;
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-2">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "name"}
        className={cn(
          "w-full border rounded-lg px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none transition-colors",
          filled
            ? "bg-white text-black border-white/40"
            : "bg-[#111111] text-white border-[hsl(var(--border))] focus:bg-white focus:text-black focus:border-white/40",
        )}
      />
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(m: "login" | "register") {
    setMode(m);
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email, password }
        : { email, name, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json<{ user?: { id: number; name: string; email: string }; error?: string }>();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");

      if (data.user) {
        localStorage.setItem("rb_user", JSON.stringify(data.user));
      }
      router.push("/bem-vindo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(false);
    }
  }

  const canSubmit =
    mode === "login"
      ? !!(email && password)
      : !!(name && email && password && password.length >= 6);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/30 flex items-center justify-center">
            <Shield className="h-8 w-8 text-[hsl(var(--red))]" fill="currentColor" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black tracking-[0.25em] uppercase text-white">
              Rebanho Blindado
            </p>
            <p className="text-xs text-white/40 mt-0.5">Calendário Sanitário</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-[hsl(var(--red))] text-white"
                  : "bg-transparent text-white/50 hover:text-white",
              )}
            >
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <Field
              label="Nome completo"
              value={name}
              onChange={setName}
              placeholder="Seu nome"
            />
          )}
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="email@exemplo.com"
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
          />

          {error && (
            <div className="px-4 py-2.5 bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/30 rounded-lg text-sm text-[hsl(var(--red))]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[hsl(var(--red))] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde…</>
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
