import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { getEnv } from "@/lib/cf";
import {
  getUserById,
  listActiveBanners,
  listPublishedModulesWithLessons,
} from "@/lib/db";
import { formatDateBR } from "@/lib/format";
import { LogoutButton } from "@/components/logout-button";
import { ModulesList } from "@/components/content/modules-list";
import type { RequestStatus } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface RequestRow {
  id: number;
  status: RequestStatus;
  deadline: string | null;
  cal_status: string | null;
  cal_id: number | null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) redirect("/auth");

  const db = getEnv().DB;
  const user = await getUserById(db, Number(uid));
  if (!user) redirect("/auth");

  const request = await db
    .prepare(
      `SELECT cr.id, cr.status, cr.deadline,
              c.status  AS cal_status,
              c.id      AS cal_id
       FROM calendar_requests cr
       LEFT JOIN calendars c ON c.request_id = cr.id
       WHERE cr.user_id = ?1
       ORDER BY cr.created_at DESC
       LIMIT 1`,
    )
    .bind(Number(uid))
    .first<RequestRow>();

  const banners = await listActiveBanners(db);
  const modules = await listPublishedModulesWithLessons(db);

  const firstName = user.name.split(" ")[0];
  const isDelivered = request?.status === "delivered";

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">

      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Image
            src="/logo-rb.png"
            alt="Rebanho Blindado"
            width={44}
            height={44}
            style={{ width: 44, height: "auto", borderRadius: 8, flexShrink: 0 }}
            priority
          />
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-white/60">
              Olá, <span className="text-white font-semibold">{firstName}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Status card */}
        <div
          className={`rounded-xl border p-5 space-y-3 ${
            isDelivered
              ? "bg-[#0d2818] border-[hsl(var(--green))]/30"
              : "bg-[hsl(var(--card))] border-[hsl(var(--border))]"
          }`}
        >
          <div className="flex items-center gap-3">
            {isDelivered ? (
              <CheckCircle2 className="h-6 w-6 text-[hsl(var(--green))] flex-shrink-0" />
            ) : (
              <Clock className="h-6 w-6 text-[hsl(var(--red))] flex-shrink-0" />
            )}
            <h2 className="text-base font-bold text-white">
              {isDelivered
                ? "Seu calendário está disponível"
                : "Seu calendário está em produção"}
            </h2>
          </div>

          {!isDelivered && (
            <>
              <p className="text-sm text-white/60 leading-relaxed">
                Recebemos suas informações e nosso time já está trabalhando na
                criação do seu calendário sanitário personalizado.
              </p>
              {request?.deadline && (
                <div className="inline-flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs text-white/60">
                    Prazo de entrega:{" "}
                    <span className="text-white font-medium">
                      {formatDateBR(request.deadline)}
                    </span>
                  </span>
                </div>
              )}
            </>
          )}

          {isDelivered && (
            <button className="w-full py-2.5 rounded-lg bg-[hsl(var(--green))] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Ver calendário
            </button>
          )}
        </div>

        {/* No request yet */}
        {!request && (
          <p className="text-sm text-white/40 text-center py-2">
            Nenhuma solicitação encontrada.
          </p>
        )}

        {/* Banners */}
        {banners.length > 0 && (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="relative rounded-xl overflow-hidden border border-white/8"
              >
                {banner.image_url ? (
                  <>
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full object-cover max-h-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-sm font-semibold text-white leading-snug">
                        {banner.title}
                      </p>
                      {banner.description && (
                        <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                          {banner.description}
                        </p>
                      )}
                      {banner.button_label && banner.button_link && (
                        <Link
                          href={banner.button_link}
                          className="inline-block mt-2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-md hover:bg-white/90 transition-opacity"
                        >
                          {banner.button_label}
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-5 bg-[hsl(var(--card))]">
                    <p className="text-sm font-semibold text-white">{banner.title}</p>
                    {banner.description && (
                      <p className="text-xs text-white/60 mt-1 leading-relaxed">
                        {banner.description}
                      </p>
                    )}
                    {banner.button_label && banner.button_link && (
                      <Link
                        href={banner.button_link}
                        className="inline-block mt-3 px-4 py-1.5 bg-[hsl(var(--green))] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {banner.button_label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modules */}
        {modules.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Conteúdo educacional
            </h2>
            <ModulesList modules={modules} />
          </div>
        ) : (
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
            <p className="text-sm text-white/70 leading-relaxed">
              Enquanto seu calendário fica pronto, você já pode começar a aprender
              mais sobre manejo sanitário e aumentar a eficiência do seu rebanho.
              Em breve novos conteúdos serão disponibilizados aqui.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
