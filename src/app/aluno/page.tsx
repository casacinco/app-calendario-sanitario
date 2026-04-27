import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlunoHome() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Meu calendário</h1>
        <p className="text-text-muted text-sm mt-1">
          Acompanhe o status da sua solicitação.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted text-sm">
            A área do criador será implementada na etapa 14.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
