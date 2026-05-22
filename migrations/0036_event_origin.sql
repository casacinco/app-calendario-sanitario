-- Origem do evento: 'calendar' (gerado das barras do calendário) ou 'implantacao' (protocolo inicial).
-- Eventos de implantação não entram como atrasados — são ações imediatas recomendadas.
ALTER TABLE calendar_events ADD COLUMN event_origin TEXT NOT NULL DEFAULT 'calendar';

CREATE INDEX idx_cal_events_origin ON calendar_events(event_origin);
