import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const key = path.join("/");

  try {
    const object = await getEnv().MEDIA.get(key);

    if (!object) {
      return new Response("Não encontrado", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    // Chaves geradas com timestamp são imutáveis — cache longo
    headers.set("cache-control", "public, max-age=31536000, immutable");

    return new Response(object.body, { headers });
  } catch (err) {
    return new Response(
      err instanceof Error ? err.message : "Erro interno",
      { status: 500 },
    );
  }
}
