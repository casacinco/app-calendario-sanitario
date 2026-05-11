-- Catálogo de produtos/ofertas
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Tipo de acesso e produto vinculado nos módulos
ALTER TABLE content_modules ADD COLUMN access_type TEXT NOT NULL DEFAULT 'public';
ALTER TABLE content_modules ADD COLUMN product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL;

-- Nível de assinatura do usuário
ALTER TABLE users ADD COLUMN subscription_type TEXT NOT NULL DEFAULT 'free';

-- Produtos ativos de cada usuário
CREATE TABLE IF NOT EXISTS user_products (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL DEFAULT 'active',   -- active | expired | cancelled
  expires_at TEXT,
  granted_by TEXT,                                -- manual | purchase | promo
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

-- Permissões explícitas por usuário (overrides individuais)
CREATE TABLE IF NOT EXISTS user_permissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT    NOT NULL,                    -- ex: 'premium' | 'module:42'
  granted_by TEXT,
  expires_at TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_products_user    ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product ON user_products(product_id);
CREATE INDEX IF NOT EXISTS idx_user_perms_user       ON user_permissions(user_id);
