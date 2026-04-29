-- =====================================================
-- 0005_template_pdf.sql
-- Substitui linhas do template pelo conteúdo exato
-- dos PDFs (Danilo Borrher, Jerônimo dos Santos, Christian Sampaio).
-- =====================================================

-- Limpar barras e linhas existentes
DELETE FROM calendar_bars;
DELETE FROM calendar_rows;
DELETE FROM calendar_template_rows;

-- ── BLOCO 1: Distribuição ─────────────────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (1, 'Período das chuvas', 1, 1);

-- ── BLOCO 2: Programação reprodutiva ─────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (2, 'Estação de monta', 1, 1),
  (2, 'Nascimento',       2, 1),
  (2, 'Desmama',          3, 1);

-- ── BLOCO 3: Cronograma de vacinação anual ────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (3, 'Pasteurelose — Cordeiros',              1, 1),
  (3, 'Pasteurelose — Adultos',                2, 1),
  (3, 'Clostridiose — Cordeiros',              3, 1),
  (3, 'Clostridiose — Adultos',                4, 1),
  (3, 'Leptospirose — Cordeiras',              5, 1),
  (3, 'Leptospirose — Matrizes',               6, 1),
  (3, 'Raiva — Cordeiros',                     7, 1),
  (3, 'Raiva — Adultos',                       8, 1),
  (3, 'Linfadeite caseosa — Cordeiros',        9, 1),
  (3, 'Linfadeite caseosa — Adulto imunizado', 10, 1);

-- ── BLOCO 4: Manejo do neonato ────────────────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (4, 'Cura do umbigo',       1, 1),
  (4, 'Prevenção de eimeriose', 2, 1);

-- ── BLOCO 5: Cronograma de vermifugação ──────────
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (5, 'Cordeiros',                              1, 1),
  (5, 'Adultos',                                2, 1),
  (5, 'Ovelhas prenhes (terço final da gestação)', 3, 1);
