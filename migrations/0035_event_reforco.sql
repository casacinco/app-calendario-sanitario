-- Suporte a dose+reforço: vínculo entre evento de dose e reforço gerado automaticamente.
ALTER TABLE calendar_events ADD COLUMN parent_event_id      INTEGER REFERENCES calendar_events(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN is_reforco           INTEGER NOT NULL DEFAULT 0;
ALTER TABLE calendar_events ADD COLUMN generated_automatically INTEGER NOT NULL DEFAULT 0;
ALTER TABLE calendar_events ADD COLUMN application_date     TEXT;

CREATE INDEX idx_cal_events_parent ON calendar_events(parent_event_id);
