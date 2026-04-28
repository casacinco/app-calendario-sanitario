"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("rb_user");
    router.push("/auth");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Sair"
      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors disabled:opacity-40 border border-white/10 rounded-lg px-2.5 py-1.5"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <LogOut className="h-3.5 w-3.5" />
      }
      <span>Sair</span>
    </button>
  );
}
