-- 0018_members_onboarding.sql
-- Controle de onboarding obrigatório para membros criados pelo admin.

ALTER TABLE members ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0;
