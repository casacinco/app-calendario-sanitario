-- 0032_calendar_events.sql
-- Eventos executáveis derivados das barras do calendário sanitário publicado.

CREATE TABLE IF NOT EXISTS calendar_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  calendar_id    INTEGER NOT NULL,
  request_id     INTEGER NOT NULL,
  source_bar_id  INTEGER,
  block_name     TEXT    NOT NULL,
  row_name       TEXT    NOT NULL,
  category_name  TEXT,
  event_type     TEXT    NOT NULL DEFAULT 'scheduled'
                 CHECK (event_type IN ('scheduled', 'continuous')),
  title          TEXT    NOT NULL,
  description    TEXT,
  recommendation TEXT,
  month          INTEGER,
  start_month    INTEGER,
  end_month      INTEGER,
  start_part     TEXT,
  end_part       TEXT,
  status         TEXT    NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','completed','postponed','skipped')),
  due_date       TEXT,
  completed_at   TEXT,
  postponed_to   TEXT,
  notes          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id)  REFERENCES calendar_requests(id) ON DELETE CASCADE
);

CREATE INDEX idx_cal_events_user ON calendar_events(user_id, status);
CREATE INDEX idx_cal_events_cal  ON calendar_events(calendar_id);
CREATE INDEX idx_cal_events_due  ON calendar_events(due_date);
