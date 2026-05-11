-- Progresso das aulas por usuário
CREATE TABLE IF NOT EXISTS lesson_progress (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
  lesson_id        INTEGER NOT NULL REFERENCES content_lessons(id) ON DELETE CASCADE,
  completed        INTEGER NOT NULL DEFAULT 0,
  completed_at     TEXT,
  last_accessed_at TEXT    NOT NULL DEFAULT (datetime('now')),
  access_count     INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, lesson_id)
);

-- Log de eventos por usuário
CREATE TABLE IF NOT EXISTS user_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
  event_type   TEXT    NOT NULL,  -- login | lesson_viewed | lesson_completed | material_downloaded
  lesson_id    INTEGER          REFERENCES content_lessons(id) ON DELETE SET NULL,
  material_url TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user   ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user       ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created    ON user_events(created_at);
