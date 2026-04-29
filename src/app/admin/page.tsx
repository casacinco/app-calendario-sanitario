import { listAdminRequests } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { AdminRequests } from "@/components/admin-requests";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await listAdminRequests(getEnv().DB);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Solicitações de Calendário
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {requests.length}{" "}
          {requests.length === 1 ? "solicitação" : "solicitações"} no total
        </p>
      </header>

      <AdminRequests requests={requests} />
    </div>
  );
}
