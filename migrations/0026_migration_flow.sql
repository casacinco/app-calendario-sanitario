-- Tipo de solicitação: standard (fluxo completo), migration (calendário importado), revision, update (futuros)
ALTER TABLE calendar_requests ADD COLUMN solicitation_type TEXT NOT NULL DEFAULT 'standard'
  CHECK (solicitation_type IN ('standard', 'migration', 'revision', 'update'));

-- Origem do calendário: standard (produzido do zero), imported (transcrição de PDF existente)
ALTER TABLE calendar_requests ADD COLUMN calendar_origin TEXT NOT NULL DEFAULT 'standard'
  CHECK (calendar_origin IN ('standard', 'imported'));

-- Status interno do processo de migração (só relevante quando solicitation_type = 'migration')
ALTER TABLE calendar_requests ADD COLUMN migration_status TEXT
  CHECK (migration_status IN ('awaiting_migration', 'in_migration', 'internal_review', 'published', 'delivered'));

-- URL do PDF original do calendário (carregado pela equipe interna via R2)
ALTER TABLE calendar_requests ADD COLUMN migration_pdf_url TEXT;

-- Responsável pela migração (nome livre: operador, suporte, equipe interna)
ALTER TABLE calendar_requests ADD COLUMN migration_assignee TEXT;

-- Observações internas sobre a migração
ALTER TABLE calendar_requests ADD COLUMN migration_notes TEXT;
