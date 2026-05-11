-- ── Módulos ──────────────────────────────────────────────────────────────────
CREATE TABLE content_modules (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  accent_color  TEXT    NOT NULL DEFAULT '#5FAF3E',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'active', -- active|hidden|blocked
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Aulas ─────────────────────────────────────────────────────────────────────
CREATE TABLE content_lessons (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id        INTEGER NOT NULL REFERENCES content_modules(id) ON DELETE CASCADE,
  title            TEXT    NOT NULL,
  description      TEXT,
  thumbnail_url    TEXT,
  video_url        TEXT,
  duration_minutes INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'draft', -- published|draft|hidden
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX content_lessons_module_idx ON content_lessons(module_id);

-- ── Materiais da aula ─────────────────────────────────────────────────────────
CREATE TABLE content_lesson_files (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id  INTEGER NOT NULL REFERENCES content_lessons(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  file_type  TEXT    NOT NULL DEFAULT 'link', -- pdf|spreadsheet|image|video|link
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX content_lesson_files_lesson_idx ON content_lesson_files(lesson_id);

-- ── Banners ───────────────────────────────────────────────────────────────────
CREATE TABLE banners (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  description  TEXT,
  image_url    TEXT,
  button_label TEXT,
  button_link  TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Biblioteca de arquivos ────────────────────────────────────────────────────
CREATE TABLE content_library_files (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  file_type  TEXT    NOT NULL DEFAULT 'link', -- pdf|spreadsheet|image|video|link
  notes      TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
