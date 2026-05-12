import { updateBanner, deleteBanner } from "@/lib/db";
import type { BannerPlacement } from "@/lib/db";

const VALID_PLACEMENTS = new Set<BannerPlacement>(["home", "conteudos", "calendario", "ferramentas"]);
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bannerId = Number(id);
  if (!Number.isFinite(bannerId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  try {
    const banner = await updateBanner(getEnv().DB, bannerId, {
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: body.description ? String(body.description).trim() : null }),
      ...(body.image_url !== undefined && { image_url: body.image_url ? String(body.image_url).trim() : null }),
      ...(body.button_label !== undefined && { button_label: body.button_label ? String(body.button_label).trim() : null }),
      ...(body.button_link !== undefined && { button_link: body.button_link ? String(body.button_link).trim() : null }),
      ...(body.is_active !== undefined && { is_active: body.is_active === false || body.is_active === 0 ? 0 : 1 }),
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
      ...(body.placement !== undefined && VALID_PLACEMENTS.has(body.placement as BannerPlacement) && { placement: body.placement as BannerPlacement }),
    });
    return Response.json({ banner });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bannerId = Number(id);
  if (!Number.isFinite(bannerId)) return Response.json({ error: "ID inválido" }, { status: 400 });

  try {
    await deleteBanner(getEnv().DB, bannerId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
