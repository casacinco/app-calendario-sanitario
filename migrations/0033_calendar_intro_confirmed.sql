-- 0033_calendar_intro_confirmed.sql
-- Rastreia confirmação de leitura do aviso inicial do calendário.

ALTER TABLE calendar_requests ADD COLUMN calendar_intro_confirmed     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE calendar_requests ADD COLUMN calendar_intro_confirmed_at  TEXT;
