-- Adiciona observação sobre dose reforço do vermífugo em todos os calendários
-- que já possuem o bloco 5 (Vermifugação) mas ainda não têm essa nota.
INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT r.calendar_id, 5,
  'A dose reforço do vermífugo deve ser administrado entre 17 e 21 dias após a 1ª dose.',
  1, 2
FROM calendar_rows r
WHERE r.block_position = 5
  AND NOT EXISTS (
    SELECT 1 FROM calendar_block_notes n
    WHERE n.calendar_id = r.calendar_id
      AND n.block_position = 5
      AND n.text LIKE '%dose reforço do vermífugo%'
  );
