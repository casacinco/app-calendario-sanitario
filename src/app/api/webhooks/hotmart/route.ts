import { processExternalEvent } from "@/lib/db";
import { getEnv } from "@/lib/cf";
import type { ExternalEventType } from "@/lib/db";

export const runtime = "edge";

// ── Mapeamento de eventos Hotmart → tipos internos ────────────────────────────
const HOTMART_EVENT_MAP: Record<string, ExternalEventType> = {
  PURCHASE_APPROVED:         "purchase",
  PURCHASE_COMPLETE:         "purchase",
  PURCHASE_CANCELED:         "cancellation",
  PURCHASE_REFUNDED:         "refund",
  PURCHASE_CHARGEBACK:       "chargeback",
  PURCHASE_EXPIRED:          "expiration",
  PURCHASE_PROTEST:          "chargeback",
  SUBSCRIPTION_CANCELLATION: "cancellation",
  RECURRENCE_APPROVED:       "renewal",
};

// ── Segredo de validação (variável de ambiente HOTMART_SECRET) ────────────────
// Quando a integração real for ativada, validar o header hottok aqui.

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extrair tipo de evento
  const rawEvent = typeof body.event === "string" ? body.event.toUpperCase() : "";
  const eventType = HOTMART_EVENT_MAP[rawEvent];
  if (!eventType) {
    // Evento desconhecido — aceitar mas não processar (para evitar retries)
    return Response.json({ received: true, processed: false, reason: "unknown_event" });
  }

  // Extrair dados do payload Hotmart
  const data    = (body.data    as Record<string, unknown>) ?? {};
  const buyer   = (data.buyer   as Record<string, unknown>) ?? {};
  const product = (data.product as Record<string, unknown>) ?? {};
  const purchase = (data.purchase as Record<string, unknown>) ?? {};
  const subscription = (data.subscription as Record<string, unknown>) ?? {};

  const email = typeof buyer.email === "string" ? buyer.email.toLowerCase().trim() : null;
  if (!email) return Response.json({ error: "Missing buyer email" }, { status: 400 });

  // Determinar dias de acesso a partir do plano/produto
  // TODO: mapear product.id para planos e duração real quando a integração for ativada
  const accessDays = extractAccessDays(subscription, purchase);

  try {
    const result = await processExternalEvent(getEnv().DB, {
      platform:       "hotmart",
      event_type:     eventType,
      transaction_id: typeof purchase.transaction === "string" ? purchase.transaction : null,
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
    // Evento duplicado retorna 200 (idempotência)
    if (msg.includes("Evento duplicado")) {
      return Response.json({ received: true, processed: false, reason: "duplicate" });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}

function extractAccessDays(
  subscription: Record<string, unknown>,
  purchase: Record<string, unknown>,
): number | null {
  // Assinatura recorrente: duração por número de recorrências não mapeada ainda
  // Retornar null (vitalício) para não bloquear — ajustar quando integração for ativada
  void subscription;
  void purchase;
  return 365; // placeholder: 365 dias por padrão até mapeamento real de planos
}
