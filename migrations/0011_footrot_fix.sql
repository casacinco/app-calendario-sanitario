-- 0011_footrot_fix.sql
-- Corrige todas as inconsistências do Foot-rot após migrações 0009/0010.
--
-- Situação atual do template (block_id=3):
--   pos 6: Leptospirose — Matrizes  (id 48)  ← correto
--   pos 6: Foot-rot — Cordeiros     (id 58)  ← ERRADO, conflita com pos 6
--   pos 8: Raiva — Cordeiros        (id 49)  ← foi deslocado +1 desnecessariamente
--   pos 9: Raiva — Adultos          (id 50)
--   pos 10: Linfadeite caseosa — Cordeiros   (id 51)
--   pos 11: Linfadeite caseosa — Adulto imunizado (id 52)
--   (sem Foot-rot — Adultos)
--
-- Objetivo: posições corretas → pos 11 e 12 para Foot-rot

-- ── 1. TEMPLATE: restaurar posições de Raiva e Linfadeite (8→7, 9→8, 10→9, 11→10)
UPDATE calendar_template_rows SET position = 7  WHERE block_id = 3 AND name = 'Raiva — Cordeiros';
UPDATE calendar_template_rows SET position = 8  WHERE block_id = 3 AND name = 'Raiva — Adultos';
UPDATE calendar_template_rows SET position = 9  WHERE block_id = 3 AND name = 'Linfadeite caseosa — Cordeiros';
UPDATE calendar_template_rows SET position = 10 WHERE block_id = 3 AND name = 'Linfadeite caseosa — Adulto imunizado';

-- ── 2. TEMPLATE: mover Foot-rot — Cordeiros para posição 11 (fim do bloco)
UPDATE calendar_template_rows SET position = 11 WHERE block_id = 3 AND name = 'Foot-rot — Cordeiros';

-- ── 3. TEMPLATE: inserir Foot-rot — Adultos na posição 12
INSERT INTO calendar_template_rows (block_id, name, position, default_active)
VALUES (3, 'Foot-rot — Adultos', 12, 1);

-- ── 4. CALENDÁRIOS: corrigir block_name errado nas linhas Foot-rot (calendários 9-16)
UPDATE calendar_rows
SET block_name = 'CRONOGRAMA ANUAL DE VACINAÇÃO'
WHERE block_position = 3
  AND row_name LIKE 'Foot-rot%'
  AND block_name = 'Vacinação';

-- ── 5. CALENDÁRIOS: inserir Foot-rot — Adultos em todos os calendários que não têm
INSERT INTO calendar_rows (calendar_id, template_row_id, block_name, row_name, block_position, row_position, is_active)
SELECT
  cr.calendar_id,
  (SELECT id FROM calendar_template_rows WHERE block_id = 3 AND name = 'Foot-rot — Adultos' ORDER BY id DESC LIMIT 1),
  'CRONOGRAMA ANUAL DE VACINAÇÃO',
  'Foot-rot — Adultos',
  3,
  (SELECT MAX(cr2.row_position) + 1 FROM calendar_rows cr2 WHERE cr2.calendar_id = cr.calendar_id AND cr2.block_position = 3),
  1
FROM calendar_rows cr
WHERE cr.block_position = 3
  AND cr.row_name = 'Foot-rot — Cordeiros'
  AND NOT EXISTS (
    SELECT 1 FROM calendar_rows cr3
    WHERE cr3.calendar_id = cr.calendar_id
      AND cr3.block_position = 3
      AND cr3.row_name = 'Foot-rot — Adultos'
  );
