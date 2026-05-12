import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/db";
import { getEnv } from "@/lib/cf";

export const runtime = "edge";

const MOCK_BUYER = {
  name:  "João da Silva (Teste)",
  email: "teste.hotmart@exemplo.com.br",
};

const MOCK_PRODUCT = {
  id:   "12345678",
  name: "Produto Teste Hotmart",
};

const MOCK_TRANSACTION = "HP00000000000000";

function buildPayload(event: string, extra?: { purchase?: Record<string, unknown>; subscription?: Record<string, unknown> }) {
  return {
    event,
    data: {
      buyer:   MOCK_BUYER,
      product: MOCK_PRODUCT,
      purchase: {
        transaction:      MOCK_TRANSACTION,
        offerType:        "SUBSCRIPTION",
        recurrencyNumber: 1,
        ...(extra?.purchase ?? {}),
      },
      subscription: {
        recurrencyPeriod: "MONTHLY",
        ...(extra?.subscription ?? {}),
      },
    },
  };
}

const MOCK_EVENTS: Record<string, unknown> = {
  purchase_approved:          buildPayload("PURCHASE_APPROVED"),
  purchase_renewal:           buildPayload("PURCHASE_APPROVED", { purchase: { recurrencyNumber: 2 } }),
  purchase_refund_requested:  buildPayload("PURCHASE_REFUND_REQUESTED"),
  purchase_refunded:          buildPayload("PURCHASE_REFUNDED"),
  purchase_chargeback:        buildPayload("PURCHASE_CHARGEBACK"),
  purchase_expired:           buildPayload("PURCHASE_EXPIRED"),
  purchase_delayed:           buildPayload("PURCHASE_DELAYED"),
  subscription_cancellation:  buildPayload("SUBSCRIPTION_CANCELLATION"),
};

export async function GET(req: NextRequest) {
  // Only admins
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const user = await getUserById(getEnv().DB, Number(uid));
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  return NextResponse.json({ events: MOCK_EVENTS });
}

export async function POST(req: NextRequest) {
  // Only admins
  const cookieStore = await cookies();
  const uid = cookieStore.get("rb_uid")?.value;
  if (!uid) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const user = await getUserById(getEnv().DB, Number(uid));
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { event_key, email, override } = await req.json<{
    event_key: string;
    email?: string;
    override?: Record<string, unknown>;
  }>();

  const base = MOCK_EVENTS[event_key];
  if (!base) {
    return NextResponse.json({ error: `Evento desconhecido: ${event_key}` }, { status: 400 });
  }

  // Merge custom email and override
  const payload = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  if (email) {
    (payload.data as Record<string, unknown>).buyer = {
      ...(payload.data as Record<string, unknown>).buyer as object,
      email,
    };
  }
  if (override) {
    Object.assign(payload, override);
  }

  // Forward to the actual webhook endpoint
  const webhookUrl = new URL("/api/webhooks/hotmart", req.url);
  const resp = await fetch(webhookUrl.toString(), {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  const result = await resp.json();
  return NextResponse.json({ forwarded_payload: payload, webhook_response: result, status: resp.status });
}
