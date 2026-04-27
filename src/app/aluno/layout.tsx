import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

const navItems = [
  { href: "/aluno", label: "Meu calendário", icon: CalendarDays },
  { href: "/aluno/onboarding", label: "Nova solicitação", icon: Plus },
];

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link
            href="/aluno"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <CalendarDays className="h-5 w-5 text-text-muted" />
            Calendário Sanitário
          </Link>
          <nav className="flex gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-text-muted hover:bg-text/5 hover:text-text transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
