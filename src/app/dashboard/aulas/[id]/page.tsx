import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/conteudos?lesson=${id}`);
}
