-- =====================================================
-- 0004_template_ovinos.sql
-- Remove template de aves e substitui por ovinos.
-- Adiciona campos description e animal_category em calendar_bars.
-- =====================================================

-- Novos campos na tabela de barras
ALTER TABLE calendar_bars ADD COLUMN description     TEXT;
ALTER TABLE calendar_bars ADD COLUMN animal_category TEXT;

-- Limpar dados obsoletos (aves)
DELETE FROM calendar_bars;
DELETE FROM calendar_rows;
DELETE FROM calendar_template_rows;

-- ── BLOCO 1: Distribuição ─────────────────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (1, 'Período das chuvas', 1, 1);

-- ── BLOCO 2: Programação reprodutiva ─────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (2, 'Estação de monta',      1, 1),
  (2, 'Nascimentos esperados', 2, 1),
  (2, 'Desmama',               3, 1);

-- ── BLOCO 3: Vacinação ────────────────────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (3, 'Clostridiose — Cordeiros',          1, 1),
  (3, 'Clostridiose — Adultos',            2, 1),
  (3, 'Raiva — Cordeiros',                 3, 1),
  (3, 'Raiva — Adultos',                   4, 1),
  (3, 'Linfadenite caseosa — Adultos',     5, 1),
  (3, 'Foot-rot — Adultos',                6, 0),
  (3, 'Pneumonia — Cordeiros',             7, 0),
  (3, 'Ectima contagioso — Cordeiros',     8, 0);

-- ── BLOCO 4: Manejo do neonato ────────────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (4, 'Cura de umbigo',                    1, 1),
  (4, 'Colostro (primeiras horas)',        2, 1),
  (4, 'Prevenção de eimeriose',            3, 1),
  (4, 'Identificação (brinco / tatuagem)', 4, 1);

-- ── BLOCO 5: Vermifugação ─────────────────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (5, 'Cordeiros (FAMACHA)',               1, 1),
  (5, 'Adultos (FAMACHA)',                 2, 1),
  (5, 'Matrizes prenhes (3º trimestre)',   3, 1),
  (5, 'Reprodutores',                      4, 1);
