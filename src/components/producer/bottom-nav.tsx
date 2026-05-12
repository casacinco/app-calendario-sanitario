"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BookOpen, Wrench, Clock } from "lucide-react";

const NAV = [
  { href: "/dashboard",             label: "Início",      Icon: Home },
  { href: "/dashboard/calendario",  label: "Calendário",  Icon: Calendar },
  { href: "/dashboard/conteudos",   label: "Conteúdos",   Icon: BookOpen },
  { href: "/dashboard/ferramentas", label: "Ferramentas", Icon: Wrench },
  { href: "/dashboard/historico",   label: "Histórico",   Icon: Clock },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-2xl mx-auto flex">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative ${
                active ? "text-[#CC0000]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[#CC0000] rounded-b-full" />
              )}
              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
