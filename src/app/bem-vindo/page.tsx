"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, LogOut } from "lucide-react";

interface RbUser {
  id: number;
  name: string;
  email: string;
}

export default function BemVindoPage() {
  const router = useRouter();
  const [user, setUser] = useState<RbUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rb_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("rb_user");
    router.push("/auth");
  }

  const firstName = user?.name?.split(" ")[0] ?? "criador";

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/30 flex items-center justify-center">
            <Shield className="h-8 w-8 text-[hsl(var(--red))]" fill="currentColor" />
          </div>
          <p className="text-[13px] font-black tracking-[0.25em] uppercase text-white">
            Rebanho Blindado
          </p>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Bem-vindo, {firstName}!
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Para gerar seu calendário sanitário personalizado, precisamos de
            algumas informações sobre o seu rebanho.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/formulario")}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-[hsl(var(--red))] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Preencher formulário
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[hsl(var(--border))] text-white/50 text-sm hover:text-white hover:border-white/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

      </div>
    </div>
  );
}
