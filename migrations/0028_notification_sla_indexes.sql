-- ── Rebuild notification_events with full schema (SQLite can't ALTER CHECK) ───

CREATE TABLE notification_events_v2 (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES calendar_requests(id) ON DELETE SET NULL,
  event_type TEXT    NOT NULL,
  channel    TEXT    NOT NULL DEFAULT 'dashboard'
             CHECK (channel IN ('dashboard', 'email', 'whatsapp')),
  title      TEXT,
  message    TEXT,
  payload    TEXT    NOT NULL DEFAULT '{}',
  status     TEXT    NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  retries    INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  sent_at    TEXT
);

INSERT INTO notification_events_v2
  (id, user_id, event_type, channel, payload, status, created_at, sent_at)
SELECT id, user_id, event_type, channel, payload, status, created_at, sent_at
FROM notification_events;

DROP TABLE notification_events;
ALTER TABLE notification_events_v2 RENAME TO notification_events;

-- ── Performance indexes ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notification_events_user_id
  ON notification_events(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_events_status
  ON notification_events(status);

CREATE INDEX IF NOT EXISTS idx_migration_events_request_id
  ON migration_events(request_id);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_user_id
  ON calendar_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_migration_status
  ON calendar_requests(migration_status);

CREATE INDEX IF NOT EXISTS idx_calendar_requests_solicitation_type
  ON calendar_requests(solicitation_type);
