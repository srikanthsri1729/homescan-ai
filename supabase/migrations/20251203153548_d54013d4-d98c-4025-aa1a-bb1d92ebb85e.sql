-- Update item_category enum to include more home-focused categories
-- First, we need to add new values to the existing enum
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'kitchen';
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'furniture';
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'clothing';
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'office';