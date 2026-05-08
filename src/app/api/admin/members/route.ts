import { listMembers, createMember } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

export async function GET() {
  try {
    const members = await listMembers(getEnv().DB);
    return Response.json({ members });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    product?: string;
    status?: string;
    origin?: string;
    notes?: string;
    calendar_request_id?: number;
    entry_date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!body.email?.trim()) return Response.json({ error: "E-mail é obrigatório" }, { status: 400 });

  try {
    const member = await createMember(getEnv().DB, {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      product: body.product?.trim() || null,
      status: body.status === "blocked" ? "blocked" : "active",
      origin: body.origin?.trim() || null,
      notes: body.notes?.trim() || null,
      calendar_request_id: body.calendar_request_id ?? null,
      entry_date: body.entry_date || undefined,
    });
    return Response.json({ member }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 },
    );
  }
}
