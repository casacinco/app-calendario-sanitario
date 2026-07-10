-- Habilita/desabilita a Central de Manejo (execução automática do calendário) para o produtor.
ALTER TABLE calendar_requests ADD COLUMN central_management_enabled INTEGER NOT NULL DEFAULT 0
  CHECK (central_management_enabled IN (0, 1));

-- Início do período de teste/trial da Central de Manejo (reservado para uso futuro).
ALTER TABLE calendar_requests ADD COLUMN central_management_trial_started_at TEXT;

-- Fim do período de teste/trial da Central de Manejo (reservado para uso futuro).
ALTER TABLE calendar_requests ADD COLUMN central_management_trial_ends_at TEXT;

-- Registra EXCLUSIVAMENTE a primeira ativação da Central de Manejo.
-- Regra de aplicação futura (não desta migration): nunca sobrescrever em reativações.
ALTER TABLE calendar_requests ADD COLUMN central_management_first_activated_at TEXT;

-- Status da assinatura/uso da Central de Manejo.
ALTER TABLE calendar_requests ADD COLUMN central_management_subscription_status TEXT NOT NULL DEFAULT 'inactive'
  CHECK (central_management_subscription_status IN ('inactive', 'trial', 'active', 'cancelled', 'expired'));
