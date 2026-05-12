import { listBanners, createBanner } from "@/lib/db";
import type { BannerPlacement } from "@/lib/db";

const VALID_PLACEMENTS = new Set<BannerPlacement>(["home", "conteudos", "calendario", "ferramentas"]);
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  try {
    const banners = await listBanners(getEnv().DB);
    return Response.json({ banners });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!String(body.title ?? "").trim()) return Response.json({ error: "Título é obrigatório" }, { status: 400 });

  try {
    const rawPlacement = String(body.placement ?? "home");
    const banner = await createBanner(getEnv().DB, {
      title:        String(body.title).trim(),
      description:  body.description ? String(body.description).trim() : null,
      image_url:    body.image_url ? String(body.image_url).trim() : null,
      button_label: body.button_label ? String(body.button_label).trim() : null,
      button_link:  body.button_link ? String(body.button_link).trim() : null,
      is_active:    body.is_active === false || body.is_active === 0 ? 0 : 1,
      placement:    VALID_PLACEMENTS.has(rawPlacement as BannerPlacement) ? rawPlacement as BannerPlacement : "home",
    });
    return Response.json({ banner }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 400 });
  }
}
