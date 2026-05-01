-- 0010_footrot_reorder.sql
-- Reposiciona Foot-rot — Cordeiros (+1) e Foot-rot — Adultos (+2) para
-- aparecerem após todas as outras linhas do bloco de vacinação em cada calendário.

UPDATE calendar_rows
SET row_position = (
  SELECT MAX(cr.row_position) + 1
  FROM calendar_rows cr
  WHERE cr.calendar_id = calendar_rows.calendar_id
    AND cr.block_position = 3
    AND cr.row_name NOT LIKE 'Foot-rot%'
)
WHERE block_position = 3
  AND row_name = 'Foot-rot — Cordeiros';

UPDATE calendar_rows
SET row_position = (
  SELECT MAX(cr.row_position) + 2
  FROM calendar_rows cr
  WHERE cr.calendar_id = calendar_rows.calendar_id
    AND cr.block_position = 3
    AND cr.row_name NOT LIKE 'Foot-rot%'
)
WHERE block_position = 3
  AND row_name = 'Foot-rot — Adultos';
