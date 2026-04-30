-- =====================================================
-- 0007_block_notes.sql
-- 1. Renomeia blocos 3, 4, 5 no template e nos calendários
-- 2. Cria tabela calendar_block_notes
-- 3. Seed das observações padrão para calendários existentes
-- =====================================================

-- ── 1. Renomear no template ───────────────────────────────────────────────────
UPDATE calendar_template_blocks
SET name = 'CRONOGRAMA ANUAL DE VACINAÇÃO'
WHERE position = 3 AND template_id = 1;

UPDATE calendar_template_blocks
SET name = 'MANEJO COM O NEONATO'
WHERE position = 4 AND template_id = 1;

UPDATE calendar_template_blocks
SET name = 'CRONOGRAMA DE VERMIFUGAÇÃO DO REBANHO'
WHERE position = 5 AND template_id = 1;

-- ── 2. Renomear em todos os calendários existentes ────────────────────────────
UPDATE calendar_rows SET block_name = 'CRONOGRAMA ANUAL DE VACINAÇÃO'       WHERE block_position = 3;
UPDATE calendar_rows SET block_name = 'MANEJO COM O NEONATO'                WHERE block_position = 4;
UPDATE calendar_rows SET block_name = 'CRONOGRAMA DE VERMIFUGAÇÃO DO REBANHO' WHERE block_position = 5;

-- ── 3. Tabela de observações por bloco ───────────────────────────────────────
CREATE TABLE calendar_block_notes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id    INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  block_position INTEGER NOT NULL,
  text           TEXT    NOT NULL,
  is_visible     INTEGER NOT NULL DEFAULT 1,
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_block_notes_cal ON calendar_block_notes(calendar_id, block_position);

-- ── 4. Observações padrão para calendários existentes ────────────────────────

-- Bloco 3 — CRONOGRAMA ANUAL DE VACINAÇÃO
INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 3,
  'As doses reforço das vacinas devem ser administradas entre 21 e 30 dias após a 1ª dose;',
  1, 1
FROM calendar_rows WHERE block_position = 3;

INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 3,
  'A vacinação contra LINFADEITE CASEOSA não deve ser realizada em animais que já possuam a enfermidade, vacinar apenas os animais que tenham sido imunizados quando cordeiros;',
  1, 2
FROM calendar_rows WHERE block_position = 3;

INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 3,
  'A vacina contra leptospirose tem sua indicação de uso em todos os animais destinados à reprodução, entretanto, animais destinados ao abate, se mantidos junto ao rebanho, também devem ser vacinados;',
  1, 3
FROM calendar_rows WHERE block_position = 3;

INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 3,
  'ATENÇÃO: A dose reforço é obrigatória para todos os animais PRIMOVACINADOS (1ª vez). A partir do segundo ano, se já receberam a mesma vacina no ano anterior, não é necessário reforço em adultos;',
  1, 4
FROM calendar_rows WHERE block_position = 3;

INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 3,
  'OBS: Se mudar a marca da vacina, é obrigatório fazer dose reforço.',
  1, 5
FROM calendar_rows WHERE block_position = 3;

-- Bloco 4 — MANEJO COM O NEONATO
INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 4,
  'Realizar a cura do umbigo com iodo 10% logo após o nascimento ou produto compatível + PROBEZERRO + CATOFÓS;',
  1, 1
FROM calendar_rows WHERE block_position = 4;

INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 4,
  'Recomendação de tratamento preventivo contra EIMERIOSE com uma dose entre 21 e 30 dias após o nascimento (produtos à base de Toltrazuril).',
  1, 2
FROM calendar_rows WHERE block_position = 4;

-- Bloco 5 — CRONOGRAMA DE VERMIFUGAÇÃO DO REBANHO
INSERT INTO calendar_block_notes (calendar_id, block_position, text, is_visible, position)
SELECT DISTINCT calendar_id, 5,
  'ATENÇÃO ao vermifugar ovelhas com prenhez positiva: usar droga compatível com a categoria.',
  1, 1
FROM calendar_rows WHERE block_position = 5;
