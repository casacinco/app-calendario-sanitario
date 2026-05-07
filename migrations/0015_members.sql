-- 0015_members.sql
-- Tabela de usuários/alunos que terão acesso ao app e aos calendários.

CREATE TABLE members (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT    NOT NULL,
  email                TEXT    NOT NULL,
  phone                TEXT,
  product              TEXT,
  status               TEXT    NOT NULL DEFAULT 'active',
  origin               TEXT,
  notes                TEXT,
  calendar_request_id  INTEGER REFERENCES calendar_requests(id) ON DELETE SET NULL,
  entry_date           TEXT    NOT NULL DEFAULT (date('now')),
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX members_email_idx ON members(email);
