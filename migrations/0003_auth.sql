-- 0003_auth.sql
-- Add password_hash to users for auth
ALTER TABLE users ADD COLUMN password_hash TEXT;
