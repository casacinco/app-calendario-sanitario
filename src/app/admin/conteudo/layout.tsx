"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Image, FolderOpen } from "lucide-react";

const subItems = [
  { href: "/admin/conteudo/modulos",    label: "Módulos",    icon: Layers },
  { href: "/admin/conteudo/banners",    label: "Banners",    icon: Image },
  { href: "/admin/conteudo/biblioteca", label: "Biblioteca", icon: FolderOpen },
];

export default function ConteudoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {subItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? "border-text text-text"
                  : "border-transparent text-text-muted hover:text-text hover:border-border"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
