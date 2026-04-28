import Link from "next/link";
import { Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import { listRequestsWithDetails } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { formatDateBR, formatNumberBR } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await listRequestsWithDetails(getEnv().DB);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Solicitações</h1>
          <p className="text-text-muted text-sm mt-1">
            {requests.length === 0
              ? "Nenhuma solicitação registrada."
              : `${requests.length} ${requests.length === 1 ? "solicitação" : "solicitações"} no total.`}
          </p>
        </div>
      </header>

      {requests.length === 0 ? (
        <Card>
          <CardHeader>
            <Inbox className="h-6 w-6 text-text-muted mb-3" />
            <CardTitle>Sem solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-muted text-sm">
              Quando alguém preencher o onboarding, a solicitação aparece aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop: tabela */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-text/[0.02] text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">Nome</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Rebanho</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Prazo</th>
                  <th className="px-4 py-3 font-medium text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-text/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="block group"
                      >
                        <p className="font-medium group-hover:underline">
                          {r.user_name}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {r.farm_name}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{r.flock_species ?? "—"}</p>
                      <p className="text-text-muted text-xs mt-0.5">
                        {r.flock_total != null
                          ? `${formatNumberBR(r.flock_total)} animais`
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDateBR(r.deadline)}
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="md:hidden divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/requests/${r.id}`}
                  className="block px-4 py-4 hover:bg-text/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.user_name}</p>
                      <p className="text-text-muted text-xs mt-0.5 truncate">
                        {r.farm_name}
                      </p>
                    </div>
                    <RequestStatusBadge status={r.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                    <span>{r.flock_species ?? "—"}</span>
                    {r.flock_total != null && (
                      <span>{formatNumberBR(r.flock_total)} animais</span>
                    )}
                    <span className="ml-auto">
                      Prazo {formatDateBR(r.deadline)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
