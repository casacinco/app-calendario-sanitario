-- 0016_members_access.sql
-- Adiciona campos de perfil, tipo de acesso e data de expiração aos membros.

ALTER TABLE members ADD COLUMN profile     TEXT NOT NULL DEFAULT 'user';
ALTER TABLE members ADD COLUMN access_type TEXT NOT NULL DEFAULT '30d';
ALTER TABLE members ADD COLUMN expires_at  TEXT;
ALTER TABLE members ADD COLUMN last_access TEXT;

-- Migra status 'inactive' para 'blocked' (novo vocabulário)
UPDATE members SET status = 'blocked' WHERE status = 'inactive';
