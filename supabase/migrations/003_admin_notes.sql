-- Add admin_notes to crop_listings for rejection reasons and edit rationale
ALTER TABLE crop_listings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
