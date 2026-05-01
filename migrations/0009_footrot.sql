-- 0009_footrot.sql
-- Adiciona Foot-rot — Cordeiros ao bloco de vacinação e ativa ambas as linhas

-- 1. Deslocar template rows: Pneumonia (pos 7→8) e Ectima (pos 8→9)
UPDATE calendar_template_rows
SET position = position + 1
WHERE block_id = 3 AND position >= 7;

-- 2. Mover Foot-rot — Adultos para posição 7 e ativar por padrão
UPDATE calendar_template_rows
SET position = 7, default_active = 1
WHERE block_id = 3 AND name = 'Foot-rot — Adultos';

-- 3. Inserir Foot-rot — Cordeiros na posição 6
INSERT INTO calendar_template_rows (block_id, name, position, default_active)
VALUES (3, 'Foot-rot — Cordeiros', 6, 1);

-- 4. Deslocar calendar_rows existentes: vacinação, row_position ≥ 7 → +1
UPDATE calendar_rows
SET row_position = row_position + 1
WHERE block_position = 3 AND row_position >= 7;

-- 5. Atualizar Foot-rot — Adultos em calendários existentes: pos 7, ativar
UPDATE calendar_rows
SET row_position = 7, is_active = 1
WHERE block_position = 3 AND row_name = 'Foot-rot — Adultos';

-- 6. Inserir Foot-rot — Cordeiros em todos os calendários que já têm o bloco de vacinação
INSERT INTO calendar_rows (calendar_id, template_row_id, block_name, row_name, block_position, row_position, is_active)
SELECT DISTINCT
  cr.calendar_id,
  (SELECT id FROM calendar_template_rows WHERE block_id = 3 AND name = 'Foot-rot — Cordeiros'),
  'Vacinação',
  'Foot-rot — Cordeiros',
  3,
  6,
  1
FROM calendar_rows cr
WHERE cr.block_position = 3
  AND NOT EXISTS (
    SELECT 1 FROM calendar_rows cr2
    WHERE cr2.calendar_id = cr.calendar_id
      AND cr2.block_position = 3
      AND cr2.row_name = 'Foot-rot — Cordeiros'
  );
