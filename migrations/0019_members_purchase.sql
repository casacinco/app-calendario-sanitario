-- Campos de compra/assinatura para integração com plataformas externas
ALTER TABLE members ADD COLUMN platform             TEXT;
ALTER TABLE members ADD COLUMN transaction_id       TEXT;
ALTER TABLE members ADD COLUMN product_id           TEXT;
ALTER TABLE members ADD COLUMN product_name         TEXT;
ALTER TABLE members ADD COLUMN buyer_email          TEXT;
ALTER TABLE members ADD COLUMN buyer_name           TEXT;
ALTER TABLE members ADD COLUMN purchase_date        TEXT;
ALTER TABLE members ADD COLUMN access_start_date    TEXT;
ALTER TABLE members ADD COLUMN subscription_status  TEXT NOT NULL DEFAULT 'active';
ALTER TABLE members ADD COLUMN payment_status       TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE members ADD COLUMN last_event_received_at TEXT;
