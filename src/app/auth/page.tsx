"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

        {/* Logo oficial */}
        <Image
          src="/logo-rb.png"
          alt="Rebanho Blindado"
          width={140}
          height={140}
          style={{
            width: 140,
            height: "auto",
            display: "block",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(255,43,43,0.1)",
          }}
          priority
        />

        {/* Card */}
        <div className="w-full bg-[#141414] border border-white/8 rounded-2xl p-6 space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold text-white">
              {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
            </h1>
            <p className="text-xs text-white/45 leading-relaxed">
              {mode === "login" ? (
                <>
                  Entre para acompanhar seu<br />
                  Calendário Sanitário personalizado
                </>
              ) : (
                <>
                  Cadastre-se para solicitar seu<br />
                  Calendário Sanitário personalizado
                </>
              )}
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

      </div>
    </div>
  );
}
