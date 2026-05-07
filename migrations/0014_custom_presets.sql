-- 0014_custom_presets.sql
-- Tabela para presets/modelos criados manualmente no editor.

CREATE TABLE calendar_presets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  bars_json  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
