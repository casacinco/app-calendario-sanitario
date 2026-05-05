-- 0012_footrot_reorder_final.sql
-- Garante que Foot-rot — Cordeiros e Foot-rot — Adultos estão sempre
-- nas últimas posições do bloco de vacinação (após todas as outras linhas).
-- Corrige o calendário 18 (criado com template quebrado) e protege futuros casos.

UPDATE calendar_rows
SET row_position = (
  SELECT MAX(cr2.row_position) + 1
  FROM calendar_rows cr2
  WHERE cr2.calendar_id = calendar_rows.calendar_id
    AND cr2.block_position = 3
    AND cr2.row_name NOT LIKE 'Foot-rot%'
)
WHERE block_position = 3
  AND row_name = 'Foot-rot — Cordeiros';

UPDATE calendar_rows
SET row_position = (
  SELECT MAX(cr2.row_position) + 2
  FROM calendar_rows cr2
  WHERE cr2.calendar_id = calendar_rows.calendar_id
    AND cr2.block_position = 3
    AND cr2.row_name NOT LIKE 'Foot-rot%'
)
WHERE block_position = 3
  AND row_name = 'Foot-rot — Adultos';
