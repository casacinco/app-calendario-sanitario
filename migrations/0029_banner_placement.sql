-- Add placement to banners so each banner can target a specific area of the app
ALTER TABLE banners ADD COLUMN placement TEXT NOT NULL DEFAULT 'home';

-- Index for fast per-placement queries
CREATE INDEX IF NOT EXISTS idx_banners_placement ON banners (placement, is_active, sort_order);
