import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MemberForm } from "@/components/member-form";

export const runtime = "edge";

export default function NovoUsuarioPage() {
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

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Novo usuário</h1>
        <p className="text-text-muted text-sm mt-1">
          Preencha os dados para cadastrar um novo usuário/aluno.
        </p>
      </header>

      <MemberForm isNew />
    </div>
  );
}
