import { processExternalEvent } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import type { ExternalEventType } from "@/lib/db";

export const runtime = "edge";

// ── Mapeamento de eventos Hotmart → tipos internos ────────────────────────────
const HOTMART_EVENT_MAP: Record<string, ExternalEventType> = {
  PURCHASE_APPROVED:           "purchase",
  PURCHASE_COMPLETE:           "purchase",
  PURCHASE_CANCELED:           "cancellation",
  PURCHASE_REFUND_REQUESTED:   "refund",
  PURCHASE_REFUNDED:           "refund",
  PURCHASE_CHARGEBACK:         "chargeback",
  PURCHASE_PROTEST:            "chargeback",
  PURCHASE_EXPIRED:            "expiration",
  PURCHASE_DELAYED:            "expiration",
  SUBSCRIPTION_CANCELLATION:   "cancellation",
  RECURRENCE_APPROVED:         "renewal",
};

// ── Dias de acesso por plano de recorrência Hotmart ───────────────────────────
function extractAccessDays(
  subscription: Record<string, unknown>,
  purchase: Record<string, unknown>,
): number | null {
  const recurrencyType = typeof subscription.recurrencyPeriod === "string"
    ? subscription.recurrencyPeriod.toUpperCase()
    : null;

  // Mapeamento de período de assinatura → dias (com margem de buffer)
  if (recurrencyType) {
    if (recurrencyType.includes("MONTHLY")   || recurrencyType.includes("MENSAL"))    return 35;
    if (recurrencyType.includes("QUARTERLY") || recurrencyType.includes("TRIMESTRAL")) return 97;
    if (recurrencyType.includes("SEMIANNUAL") || recurrencyType.includes("SEMESTRAL")) return 187;
    if (recurrencyType.includes("ANNUAL")    || recurrencyType.includes("ANUAL"))     return 370;
  }

  // Venda única: checar offer_type
  const offerType = typeof purchase.offerType === "string" ? purchase.offerType.toUpperCase() : "";
  if (offerType === "SINGLE_PAYMENT") return 365;

  return 365; // padrão seguro
}

// ── Detectar renovação pela recorrência ───────────────────────────────────────
function isRenewal(purchase: Record<string, unknown>): boolean {
  const recurrencyNumber = typeof purchase.recurrencyNumber === "number"
    ? purchase.recurrencyNumber
    : Number(purchase.recurrencyNumber ?? 0);
  return recurrencyNumber > 1;
}

export async function POST(request: Request) {
  // ── Validação de segurança ────────────────────────────────────────────────
  const env = getEnv();
  const secret = env.HOTMART_WEBHOOK_SECRET;
  if (secret) {
    const token =
      request.headers.get("x-hotmart-hottok") ??
      request.headers.get("x-hotmart-webhook-token") ??
      request.headers.get("hottok");
    if (token !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Extrair tipo de evento ────────────────────────────────────────────────
  const rawEvent = typeof body.event === "string" ? body.event.toUpperCase() : "";
  let eventType = HOTMART_EVENT_MAP[rawEvent];
  if (!eventType) {
    return Response.json({ received: true, processed: false, reason: "unknown_event" });
  }

  // ── Extrair dados do payload ──────────────────────────────────────────────
  const data         = (body.data         as Record<string, unknown>) ?? {};
  const buyer        = (data.buyer        as Record<string, unknown>) ?? {};
  const product      = (data.product      as Record<string, unknown>) ?? {};
  const purchase     = (data.purchase     as Record<string, unknown>) ?? {};
  const subscription = (data.subscription as Record<string, unknown>) ?? {};

  const email = typeof buyer.email === "string" ? buyer.email.toLowerCase().trim() : null;
  if (!email) return Response.json({ error: "Missing buyer email" }, { status: 400 });

  // Renovação detectada via recurrencyNumber > 1 em eventos de compra aprovada
  if (eventType === "purchase" && isRenewal(purchase)) {
    eventType = "renewal";
  }

  const accessDays    = extractAccessDays(subscription, purchase);
  const transactionId = typeof purchase.transaction === "string" ? purchase.transaction : null;

  try {
    const result = await processExternalEvent(env.DB, {
      platform:       "hotmart",
      event_type:     eventType,
      transaction_id: transactionId,
      email,
      name:           typeof buyer.name === "string" ? buyer.name : null,
      product_id:     typeof product.id !== "undefined" ? String(product.id) : null,
      product_name:   typeof product.name === "string" ? product.name : null,
      access_days:    accessDays,
      payload:        JSON.stringify({ event: rawEvent, data }),
    });

    return Response.json({
      received:  true,
      processed: true,
      action:    result.action,
      created:   result.created,
      member_id: result.member.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Evento duplicado")) {
      return Response.json({ received: true, processed: false, reason: "duplicate" });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
