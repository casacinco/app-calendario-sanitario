-- Histórico de eventos externos por membro (compras, renovações, reembolsos, etc.)
CREATE TABLE IF NOT EXISTS member_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id      INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_type     TEXT    NOT NULL,   -- purchase | renewal | expiration | refund | cancellation | chargeback
  platform       TEXT,               -- hotmart | kiwify | perfectpay | eduzz | manual
  transaction_id TEXT,
  payload        TEXT,               -- JSON resumo do evento original
  action_taken   TEXT,               -- o que o sistema fez (ex: "access_granted_365d")
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_member_events_member_id
  ON member_events(member_id);

-- Impede eventos duplicados: mesmo transaction_id + tipo de evento
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_events_dedup
  ON member_events(transaction_id, event_type)
  WHERE transaction_id IS NOT NULL;
