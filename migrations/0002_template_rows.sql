-- =====================================================
-- 0002_template_rows.sql
-- Seed das linhas pré-definidas para cada bloco do template padrão.
-- Estas linhas representam os procedimentos típicos do calendário sanitário VPC
-- e podem ser ajustadas pelo admin (ativando/desativando) por calendário.
-- =====================================================

-- Bloco 1: Distribuição
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (1, 'Recebimento de animais',  1, 1),
  (1, 'Loteamento',                2, 1),
  (1, 'Saída de animais',          3, 1);

-- Bloco 2: Programação reprodutiva
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (2, 'Acasalamento',              1, 1),
  (2, 'Coleta de ovos',            2, 1),
  (2, 'Incubação',                 3, 1),
  (2, 'Eclosão',                   4, 1);

-- Bloco 3: Vacinação
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (3, 'Newcastle',                 1, 1),
  (3, 'Gumboro',                   2, 1),
  (3, 'Bouba aviária',             3, 1),
  (3, 'Bronquite infecciosa',      4, 1),
  (3, 'Marek',                     5, 1);

-- Bloco 4: Manejo neonato
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (4, 'Recepção do neonato',       1, 1),
  (4, 'Aquecimento',               2, 1),
  (4, 'Debicagem',                 3, 1),
  (4, 'Acompanhamento sanitário',  4, 1);

-- Bloco 5: Vermifugação
INSERT INTO calendar_template_rows (block_id, name, position, default_active) VALUES
  (5, 'Vermifugação geral',        1, 1),
  (5, 'Coccidiostato',             2, 1);
