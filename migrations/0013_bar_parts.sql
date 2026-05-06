-- 0013_bar_parts.sql
-- Adiciona posição parcial dentro do mês para início e fim das barras.
-- 'start' = início do mês, 'middle' = meio, 'end' = fim (padrão atual).

ALTER TABLE calendar_bars ADD COLUMN start_part TEXT NOT NULL DEFAULT 'start';
ALTER TABLE calendar_bars ADD COLUMN end_part   TEXT NOT NULL DEFAULT 'end';
