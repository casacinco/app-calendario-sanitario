-- 1. Rename block "Distribuição" → "Distribuição das chuvas"
UPDATE calendar_template_blocks SET name = 'Distribuição das chuvas' WHERE name = 'Distribuição';
UPDATE calendar_rows SET block_name = 'Distribuição das chuvas' WHERE block_name = 'Distribuição';

-- 2. Clear labels from distribution and reproductive bars
UPDATE calendar_bars SET label = '' WHERE label = 'PERÍODO DAS CHUVAS';
UPDATE calendar_bars SET label = '' WHERE label = 'ESTAÇÃO DE MONTA';
UPDATE calendar_bars SET label = '' WHERE label = 'NASCIMENTO';
UPDATE calendar_bars SET label = '' WHERE label = 'DESMAMA';

-- 3. Remove "APÓS 30 DIAS" from vaccination bar labels
UPDATE calendar_bars SET label = REPLACE(label, ' APÓS 30 DIAS', '') WHERE label LIKE '% APÓS 30 DIAS%';

-- 4. Fix EMERIOSE → EIMERIOSE and "TRATAMENTO PREVENTIVO" → "DOSE PREVENTIVA"
UPDATE calendar_bars SET label = 'REALIZAR DOSE PREVENTIVA CONTRA EIMERIOSE'
  WHERE label IN ('REALIZAR TRATAMENTO PREVENTIVO CONTRA EMERIOSE',
                  'REALIZAR TRATAMENTO PREVENTIVO CONTRA EIMERIOSE',
                  'PREVENTIVO EIMERIOSE');

-- 5. Remove "+ PROBEZERRO" from umbigo bar labels
UPDATE calendar_bars SET label = REPLACE(label, ' + PROBEZERRO', '') WHERE label LIKE '%PROBEZERRO%';

-- 6. Update umbigo block note
UPDATE calendar_block_notes
  SET text = 'REALIZAR A CURA DO UMBIGO APÓS O NASCIMENTO + CATOFÓS (1ml por cordeiro por via subcutânea)'
  WHERE text LIKE '%cura do umbigo%' AND text LIKE '%PROBEZERRO%';

-- 7. Update eimeriose / Toltrazuril block note
UPDATE calendar_block_notes
  SET text = 'Recomendação de dose preventiva contra EIMERIOSE com uma dose entre 21 e 30 dias após o nascimento (produtos à base de Toltrazuril - USAR A DOSE RECOMENDADA EM BULA).'
  WHERE text LIKE '%Toltrazuril%';

-- 8. Add new vermifugação notes (positions 3 and 4) for all existing calendars
--    that already have block_position = 5 notes (= have a vermifugação block)
INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
  SELECT DISTINCT calendar_id, 5,
    'Drogas mais seguras para serem utilizadas na gestação: Moxidectina 1%, Doramectina 1%, Fosfato de Levamizol - utilizar dose recomendada em bula do produto',
    1, 3
  FROM calendar_block_notes AS existing
  WHERE block_position = 5
    AND NOT EXISTS (
      SELECT 1 FROM calendar_block_notes n2
      WHERE n2.calendar_id = existing.calendar_id
        AND n2.block_position = 5
        AND n2.position = 3
    );

INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
  SELECT DISTINCT calendar_id, 5,
    'ATENÇÃO: Recomendo não vermifugar fêmeas em final de gestação',
    1, 4
  FROM calendar_block_notes AS existing
  WHERE block_position = 5
    AND NOT EXISTS (
      SELECT 1 FROM calendar_block_notes n2
      WHERE n2.calendar_id = existing.calendar_id
        AND n2.block_position = 5
        AND n2.position = 4
    );
