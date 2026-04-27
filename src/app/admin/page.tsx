import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Solicitações</h1>
        <p className="text-text-muted text-sm mt-1">
          Lista de calendários pendentes de produção.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted text-sm">
            A tabela de solicitações será implementada na etapa 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
