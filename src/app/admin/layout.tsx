import Link from "next/link";
import { Inbox, CalendarDays, Shield, Users, BookOpen } from "lucide-react";

const navItems = [
  { href: "/admin",             label: "Solicitações", icon: Inbox },
  { href: "/admin/calendarios", label: "Calendários",  icon: CalendarDays },
  { href: "/admin/usuarios",    label: "Usuários",     icon: Users },
  { href: "/admin/conteudo",    label: "Conteúdo",     icon: BookOpen },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (desktop) / Topbar (mobile) */}
      <aside className="md:w-60 md:border-r border-b md:border-b-0 border-border bg-card flex md:flex-col">
        <div className="px-6 py-5 flex items-center gap-2 md:border-b border-border">
          <Shield className="h-5 w-5 text-text-muted" />
          <span className="font-semibold tracking-tight">Admin VPC</span>
        </div>
        <nav className="flex md:flex-col flex-1 px-2 py-3 gap-1 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-muted hover:bg-text/5 hover:text-text transition-colors whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
