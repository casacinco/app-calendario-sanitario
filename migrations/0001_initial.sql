-- =====================================================
-- 0001_initial.sql
-- Schema inicial do App Calendário Sanitário VPC
-- Target: Cloudflare D1 (SQLite)
-- =====================================================

-- USERS ---------------------------------------------------------------
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  role        TEXT    NOT NULL CHECK (role IN ('user', 'admin')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_role ON users(role);

-- FARMS ---------------------------------------------------------------
CREATE TABLE farms (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  name        TEXT    NOT NULL,
  city        TEXT,
  state       TEXT,
  notes       TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_farms_user_id ON farms(user_id);

-- FLOCK DATA ----------------------------------------------------------
CREATE TABLE flock_data (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id         INTEGER NOT NULL,
  species         TEXT    NOT NULL,
  total_animals   INTEGER,
  housing_type    TEXT,
  age_groups      TEXT,
  notes           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX idx_flock_data_farm_id ON flock_data(farm_id);

-- HEALTH QUESTIONNAIRE ------------------------------------------------
CREATE TABLE health_questionnaire (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id                 INTEGER NOT NULL,
  vaccination_history     TEXT,
  current_medications     TEXT,
  recent_diseases         TEXT,
  biosecurity_practices   TEXT,
  water_source            TEXT,
  feed_source             TEXT,
  veterinary_assistance   TEXT,
  additional_info         TEXT,
  raw_responses           TEXT,
  created_at              TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX idx_health_q_farm_id ON health_questionnaire(farm_id);

-- CALENDAR REQUESTS ---------------------------------------------------
CREATE TABLE calendar_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  farm_id     INTEGER NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','in_progress','delivered','archived')),
  deadline    TEXT,
  notes       TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX idx_requests_status  ON calendar_requests(status);
CREATE INDEX idx_requests_user_id ON calendar_requests(user_id);

-- CALENDAR TEMPLATES (master, fixo) -----------------------------------
CREATE TABLE calendar_templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- CALENDAR TEMPLATE BLOCKS (5 blocos fixos) ---------------------------
CREATE TABLE calendar_template_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  name        TEXT    NOT NULL,
  position    INTEGER NOT NULL,
  FOREIGN KEY (template_id) REFERENCES calendar_templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_tpl_blocks_template ON calendar_template_blocks(template_id, position);

-- CALENDAR TEMPLATE ROWS (linhas pré-definidas por bloco) -------------
CREATE TABLE calendar_template_rows (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id        INTEGER NOT NULL,
  name            TEXT    NOT NULL,
  position        INTEGER NOT NULL,
  default_active  INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (block_id) REFERENCES calendar_template_blocks(id) ON DELETE CASCADE
);

CREATE INDEX idx_tpl_rows_block ON calendar_template_rows(block_id, position);

-- CALENDARS (instâncias criadas para cada solicitação) ----------------
CREATE TABLE calendars (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id    INTEGER NOT NULL UNIQUE,
  template_id   INTEGER NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published')),
  created_by    INTEGER NOT NULL,
  published_at  TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (request_id)  REFERENCES calendar_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES calendar_templates(id),
  FOREIGN KEY (created_by)  REFERENCES users(id)
);

CREATE INDEX idx_calendars_status  ON calendars(status);
CREATE INDEX idx_calendars_request ON calendars(request_id);

-- CALENDAR ROWS (clonadas do template, ativáveis/desativáveis) --------
CREATE TABLE calendar_rows (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id      INTEGER NOT NULL,
  template_row_id  INTEGER NOT NULL,
  block_name       TEXT    NOT NULL,
  row_name         TEXT    NOT NULL,
  block_position   INTEGER NOT NULL,
  row_position     INTEGER NOT NULL,
  is_active        INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (calendar_id)     REFERENCES calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (template_row_id) REFERENCES calendar_template_rows(id)
);

CREATE INDEX idx_cal_rows_calendar ON calendar_rows(calendar_id);
CREATE INDEX idx_cal_rows_active   ON calendar_rows(calendar_id, is_active);

-- CALENDAR BARS (intervalos dentro de cada linha) ---------------------
CREATE TABLE calendar_bars (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_row_id  INTEGER NOT NULL,
  start_month      INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  end_month        INTEGER NOT NULL CHECK (end_month   BETWEEN 1 AND 12),
  label            TEXT,
  color            TEXT    NOT NULL DEFAULT '#2BA152',
  alert            INTEGER NOT NULL DEFAULT 0,
  position         INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (start_month <= end_month),
  FOREIGN KEY (calendar_row_id) REFERENCES calendar_rows(id) ON DELETE CASCADE
);

CREATE INDEX idx_bars_row ON calendar_bars(calendar_row_id);

-- NOTE BLOCKS (biblioteca de blocos de orientação) --------------------
CREATE TABLE note_blocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  content     TEXT    NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- CALENDAR NOTE BLOCKS (associação calendário ↔ bloco com overrides) --
CREATE TABLE calendar_note_blocks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id     INTEGER NOT NULL,
  note_block_id   INTEGER NOT NULL,
  custom_title    TEXT,
  custom_content  TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  position        INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (calendar_id)   REFERENCES calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (note_block_id) REFERENCES note_blocks(id),
  UNIQUE (calendar_id, note_block_id)
);

CREATE INDEX idx_cal_notes_calendar ON calendar_note_blocks(calendar_id);

-- DELIVERY LOGS (histórico de publicação/eventos) ---------------------
CREATE TABLE delivery_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  calendar_id   INTEGER NOT NULL,
  request_id    INTEGER NOT NULL,
  delivered_by  INTEGER NOT NULL,
  event         TEXT    NOT NULL
                CHECK (event IN ('published','archived','pdf_downloaded','viewed')),
  metadata      TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (calendar_id)  REFERENCES calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id)   REFERENCES calendar_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (delivered_by) REFERENCES users(id)
);

CREATE INDEX idx_logs_calendar ON delivery_logs(calendar_id);
CREATE INDEX idx_logs_request  ON delivery_logs(request_id);

-- =====================================================
-- SEED: Template padrão fixo (5 blocos)
-- =====================================================
INSERT INTO calendar_templates (id, name, version, is_active)
VALUES (1, 'Template Padrão VPC', 1, 1);

INSERT INTO calendar_template_blocks (template_id, name, position) VALUES
  (1, 'Distribuição',             1),
  (1, 'Programação reprodutiva',  2),
  (1, 'Vacinação',                3),
  (1, 'Manejo neonato',           4),
  (1, 'Vermifugação',             5);
