import { listAdminRequests, getAdminMigrationStats } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { AdminRequests } from "@/components/admin-requests";
import { ArrowRightLeft, Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function StatCard({
  label, value, accent, Icon,
}: {
  label: string;
  value: number | string;
  accent?: string;
  Icon: React.FC<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[hsl(var(--card))] px-4 py-3 flex items-center gap-3">
      <Icon className={`h-5 w-5 flex-shrink-0 ${accent ?? "text-white/40"}`} />
      <div>
        <p className={`text-xl font-bold tabular-nums leading-none ${accent ?? "text-white"}`}>{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminRequestsPage() {
  const db = getEnv().DB;
  const [requests, migStats] = await Promise.all([
    listAdminRequests(db),
    getAdminMigrationStats(db),
  ]);

  const standardCount  = requests.filter(r => r.solicitation_type !== "migration").length;
  const migrationCount = requests.filter(r => r.solicitation_type === "migration").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Solicitações de Calendário
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {requests.length} {requests.length === 1 ? "solicitação" : "solicitações"} no total
          {" "}· {standardCount} standard · {migrationCount} migrações
        </p>
      </header>

      {/* Migration metrics */}
      {migStats.total > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white/80">Painel de Migrações</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total"         value={migStats.total}       Icon={ArrowRightLeft} accent="text-blue-400" />
            <StatCard label="Aguardando"    value={migStats.awaiting}    Icon={Clock}          accent="text-yellow-400" />
            <StatCard label="Em migração"   value={migStats.in_progress} Icon={RefreshCw}      accent="text-blue-400" />
            <StatCard label="Em revisão"    value={migStats.review}      Icon={Clock}          accent="text-purple-400" />
            <StatCard label="Publicados"    value={migStats.published}   Icon={CheckCircle2}   accent="text-green-400" />
            <StatCard label="SLA atrasado"  value={migStats.late}        Icon={AlertTriangle}  accent={migStats.late > 0 ? "text-red-400" : "text-white/30"} />
          </div>
        </div>
      )}

      <AdminRequests requests={requests} />
    </div>
  );
}
