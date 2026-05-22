-- Mês de ativação do calendário: referência para a lógica de "atrasados".
-- Evita marcar como atrasados eventos de meses anteriores à publicação.
ALTER TABLE calendars ADD COLUMN activation_month INTEGER;

-- Retroativo: preenche a partir da data de publicação existente.
UPDATE calendars
   SET activation_month = CAST(strftime('%m', published_at) AS INTEGER)
 WHERE status = 'published'
   AND published_at IS NOT NULL;
