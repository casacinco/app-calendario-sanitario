import { listMembers, listAdminRequests } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { MembersList } from "@/components/members-list";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const [members, requests] = await Promise.all([
    listMembers(getEnv().DB),
    listAdminRequests(getEnv().DB),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-text-muted text-sm mt-1">
          Gestão de alunos, produtores e assinantes
        </p>
      </header>

      <MembersList members={members} requests={requests} />
    </div>
  );
}
