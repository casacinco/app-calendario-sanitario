-- 0017_members_credentials.sql
-- Adiciona credenciais de acesso e informações de dispositivo aos membros.

ALTER TABLE members ADD COLUMN password    TEXT;
ALTER TABLE members ADD COLUMN device_info TEXT;
