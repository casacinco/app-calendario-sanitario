-- Separar onboarding_completed de migration_completed (ponto 8)
ALTER TABLE members ADD COLUMN migration_completed INTEGER NOT NULL DEFAULT 0;

-- Métricas operacionais da migração (ponto 7)
ALTER TABLE calendar_requests ADD COLUMN migration_assignee_role TEXT
  CHECK (migration_assignee_role IN ('operador', 'suporte', 'equipe_interna', 'administrador'));
ALTER TABLE calendar_requests ADD COLUMN migration_assigned_at TEXT;
ALTER TABLE calendar_requests ADD COLUMN migration_started_at TEXT;
ALTER TABLE calendar_requests ADD COLUMN migration_published_at TEXT;
ALTER TABLE calendar_requests ADD COLUMN estimated_delivery_date TEXT;

-- Origem da migração: hotmart ou manual (ponto 11)
ALTER TABLE calendar_requests ADD COLUMN migration_source TEXT
  CHECK (migration_source IN ('hotmart', 'manual', 'other'));

-- Histórico de eventos da migração (ponto 13)
CREATE TABLE IF NOT EXISTS migration_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id   INTEGER NOT NULL REFERENCES calendar_requests(id) ON DELETE CASCADE,
  event_type   TEXT    NOT NULL,  -- status_changed | assignee_set | pdf_uploaded | notes_updated | form_submitted | created_manual
  old_value    TEXT,
  new_value    TEXT,
  performed_by TEXT,
  notes        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Eventos de notificação para automações futuras (ponto 3/5)
CREATE TABLE IF NOT EXISTS notification_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT    NOT NULL,  -- migration_started | migration_published | migration_delivered
  channel    TEXT    NOT NULL DEFAULT 'whatsapp',  -- whatsapp | email | push
  payload    TEXT    NOT NULL,  -- JSON com nome, telefone, status, links
  status     TEXT    NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  sent_at    TEXT
);
