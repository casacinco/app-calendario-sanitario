import { listMembers } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { MembersList } from "@/components/members-list";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const members = await listMembers(getEnv().DB);
  const active = members.filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-text-muted text-sm mt-1">
          {members.length} {members.length === 1 ? "usuário" : "usuários"} cadastrado{members.length !== 1 ? "s" : ""}
          {" · "}{active} ativo{active !== 1 ? "s" : ""}
        </p>
      </header>

      <MembersList members={members} />
    </div>
  );
}
