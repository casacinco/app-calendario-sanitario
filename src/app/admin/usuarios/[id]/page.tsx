import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMember } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import { MemberForm } from "@/components/member-form";
import { formatDateBR } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UsuarioDetailPage({ params }: PageProps) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId) || memberId <= 0) notFound();

  const member = await getMember(getEnv().DB, memberId);
  if (!member) notFound();

  const isActive = member.status === "active";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para usuários
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{member.name}</h1>
            <span
              className={`inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                isActive
                  ? "bg-green/15 text-green border-green/30"
                  : "bg-text-muted/10 text-text-muted border-border"
              }`}
            >
              {isActive ? "Ativo" : "Inativo"}
            </span>
          </div>
          <p className="text-text-muted text-sm">{member.email}</p>
          <p className="text-text-muted text-xs">
            Cadastrado em {formatDateBR(member.created_at)}
            {member.product ? ` · ${member.product}` : ""}
            {member.origin ? ` · via ${member.origin}` : ""}
          </p>
        </div>
      </header>

      <MemberForm member={member} />
    </div>
  );
}
