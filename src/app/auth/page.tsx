"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Crossed syringes — replicating the Rebanho Blindado logo icon
function BrandIcon() {
  return (
    <div className="w-[84px] h-[84px] bg-black rounded-2xl flex items-center justify-center shadow-lg">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Syringe 1: top-right → bottom-left */}
        <g transform="rotate(45, 26, 26)">
          <rect x="10" y="23" width="26" height="6" rx="3" fill="white"/>
          <path d="M36 23.5L43 26L36 28.5Z" fill="white"/>
          <rect x="6" y="21" width="4" height="10" rx="2" fill="white"/>
          <rect x="3" y="23.5" width="6" height="5" rx="1.5" fill="white"/>
        </g>
        {/* Syringe 2: top-left → bottom-right */}
        <g transform="rotate(-45, 26, 26)">
          <rect x="10" y="23" width="26" height="6" rx="3" fill="white"/>
          <path d="M36 23.5L43 26L36 28.5Z" fill="white"/>
          <rect x="6" y="21" width="4" height="10" rx="2" fill="white"/>
          <rect x="3" y="23.5" width="6" height="5" rx="1.5" fill="white"/>
        </g>
      </svg>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const filled = value.length > 0;
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          "w-full rounded-lg px-4 py-3 text-sm border focus:outline-none transition-colors",
          filled
            ? "bg-white text-black border-white/30 placeholder:text-black/30"
            : "bg-[#1a1a1a] text-white border-white/10 placeholder:text-white/25 focus:bg-white focus:text-black focus:border-white/30 focus:placeholder:text-black/30",
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

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, name, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json<{
        user?: { id: number; name: string; email: string };
        error?: string;
      }>();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      if (data.user) localStorage.setItem("rb_user", JSON.stringify(data.user));
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[340px] flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <BrandIcon />
          <div className="text-center leading-none mt-1">
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/50 mb-0.5">
              Programa
            </p>
            <p className="text-[26px] font-black tracking-tight text-white leading-none">
              REBANHO
            </p>
            <p className="text-[26px] font-black tracking-tight text-[hsl(var(--red))] leading-none">
              BLINDADO
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center">
          <p className="text-[15px] font-semibold text-white leading-snug">
            Blinde seu rebanho
          </p>
          <p className="text-[15px] font-semibold text-white leading-snug">
            e aumente seu lucro
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">
              {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
            </h1>
            <p className="text-xs text-white/45 leading-relaxed">
              {mode === "login"
                ? "Entre para acompanhar seu Calendário Sanitário personalizado"
                : "Cadastre-se para solicitar seu Calendário Sanitário"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <Field
                label="Nome completo"
                value={name}
                onChange={setName}
                placeholder="Seu nome"
                autoComplete="name"
              />
            )}
            <Field
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="voce@exemplo.com"
              autoComplete="email"
            />
            <Field
              label="Senha"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {error && (
              <p className="text-xs text-[hsl(var(--red))] text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-3 rounded-xl bg-[hsl(var(--red))] text-white text-sm font-bold tracking-wide disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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

          {/* Mode toggle */}
          <p className="text-xs text-center text-white/40">
            {mode === "login" ? (
              <>
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-[hsl(var(--red))] font-semibold hover:opacity-80 transition-opacity"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-[hsl(var(--red))] font-semibold hover:opacity-80 transition-opacity"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar
        </button>

      </div>
    </div>
  );
}
