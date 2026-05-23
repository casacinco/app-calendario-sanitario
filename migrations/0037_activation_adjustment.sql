-- Controle de ajuste único do primeiro ciclo sanitário.
ALTER TABLE calendar_requests ADD COLUMN initial_activation_adjustment_completed INTEGER NOT NULL DEFAULT 0;

-- Histórico de ajustes automáticos (supersede / reagendamento) aplicados na ativação inicial.
CREATE TABLE calendar_event_adjustments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL,
  calendar_id       INTEGER NOT NULL,
  event_id          INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  adjustment_type   TEXT    NOT NULL, -- 'superseded' | 'rescheduled'
  original_due_date TEXT,
  new_due_date      TEXT,
  reason            TEXT    NOT NULL,
  adjusted_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cal_adj_calendar ON calendar_event_adjustments(calendar_id);
CREATE INDEX idx_cal_adj_event    ON calendar_event_adjustments(event_id);
