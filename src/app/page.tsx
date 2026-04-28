import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Calendário Sanitário VPC
          </h1>
          <p className="mt-3 text-text-muted">
            Sistema de produção de calendários sanitários para ovinocultura
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/auth" className="group">
            <Card className="h-full transition-colors group-hover:border-text-muted">
              <CardHeader>
                <CalendarDays className="h-6 w-6 text-text-muted mb-3" />
                <CardTitle>Área do criador</CardTitle>
                <CardDescription>
                  Solicite seu calendário e acompanhe a produção.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin" className="group">
            <Card className="h-full transition-colors group-hover:border-text-muted">
              <CardHeader>
                <Shield className="h-6 w-6 text-text-muted mb-3" />
                <CardTitle>Área do admin</CardTitle>
                <CardDescription>
                  Analise solicitações e produza calendários.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
