-- Site settings key/value store
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT NOT NULL PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
