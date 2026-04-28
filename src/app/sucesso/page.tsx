"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Shield, LogOut } from "lucide-react";

function SucessoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rb_user");
      if (raw) setUserName(JSON.parse(raw)?.name?.split(" ")[0] ?? null);
    } catch {
      // ignore
    }
  }, []);

  const requestId = params.get("id");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("rb_user");
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-[hsl(var(--red))]" fill="currentColor" />
          </div>
        </div>

        {/* Success card */}
        <div className="bg-[#0d2818] border border-[hsl(var(--green))]/30 rounded-xl p-8 space-y-4">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--green))]/20 flex items-center justify-center mx-auto">
            <Check className="h-7 w-7 text-[hsl(var(--green))]" />
          </div>

          <h2 className="text-xl font-bold text-white">
            Solicitação enviada!
          </h2>

          <p className="text-sm text-white/60 leading-relaxed">
            {userName && (
              <>
                <span className="text-white font-medium">{userName}</span>,{" "}
              </>
            )}
            recebemos sua solicitação
            {requestId && (
              <>
                {" "}
                <span className="text-white font-medium">#{requestId}</span>
              </>
            )}
            . Em breve nossa equipe técnica irá analisar os dados e produzir
            seu calendário sanitário personalizado.
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[hsl(var(--border))] text-white/50 text-sm hover:text-white hover:border-white/30 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>

      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense>
      <SucessoContent />
    </Suspense>
  );
}
