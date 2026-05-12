import { getEnv } from "@/lib/cf";

export const runtime = "edge";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png",
]);

const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_DOC_SIZE   = 25 * 1024 * 1024;  // 25 MB

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const file   = formData.get("file");
  const folder = (formData.get("folder") as string | null) ?? "uploads";

  if (!(file instanceof File)) {
    return Response.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  const isDoc   = ALLOWED_DOC_TYPES.has(file.type);

  if (!isImage && !isDoc) {
    return Response.json(
      { error: "Formato não permitido. Use: JPG, PNG, PDF, XLS, XLSX, CSV, DOC ou DOCX." },
      { status: 400 },
    );
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;
  if (file.size > maxSize) {
    const mb = Math.round(maxSize / 1024 / 1024);
    return Response.json({ error: `Arquivo muito grande. Máximo: ${mb}MB.` }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `${folder}/${Date.now()}-${randomId()}.${ext}`;

  try {
    const env = getEnv();
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata:   { contentType: file.type },
      customMetadata: { originalName: file.name },
    });

    return Response.json({
      url:  `/api/media/${key}`,
      key,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar arquivo" },
      { status: 500 },
    );
  }
}
