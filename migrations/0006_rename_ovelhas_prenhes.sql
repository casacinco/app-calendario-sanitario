-- 0006_rename_ovelhas_prenhes.sql
-- Simplifica nome da linha de Ovelhas prenhes no bloco Vermifugação

UPDATE calendar_template_rows
SET name = 'Ovelhas prenhes'
WHERE name = 'Ovelhas prenhes (terço final da gestação)';

UPDATE calendar_rows
SET row_name = 'Ovelhas prenhes'
WHERE row_name = 'Ovelhas prenhes (terço final da gestação)';
