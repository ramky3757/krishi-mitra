-- Stage-based advance %: consumer pays a lower advance when booking early
-- (long wait to harvest) and higher advance when booking close to harvest.
-- Solves the "long wait = friction" problem and self-segments consumers
-- by risk appetite.

-- Crop lifecycle stages a farmer marks as the crop progresses.
ALTER TABLE public.crop_listings
  ADD COLUMN IF NOT EXISTS crop_stage TEXT DEFAULT 'pre_sowing'
    CHECK (crop_stage IN ('pre_sowing', 'sowed', 'growing', 'pre_harvest', 'ready_now')),
  ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_listings_crop_stage ON public.crop_listings(crop_stage);

-- Advance % per stage — admin-configurable via platform_config
ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS advance_pct_pre_sowing  NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  ADD COLUMN IF NOT EXISTS advance_pct_sowed       NUMERIC(5,2) NOT NULL DEFAULT 30.0,
  ADD COLUMN IF NOT EXISTS advance_pct_growing     NUMERIC(5,2) NOT NULL DEFAULT 40.0,
  ADD COLUMN IF NOT EXISTS advance_pct_pre_harvest NUMERIC(5,2) NOT NULL DEFAULT 60.0,
  ADD COLUMN IF NOT EXISTS advance_pct_ready_now   NUMERIC(5,2) NOT NULL DEFAULT 100.0;

COMMENT ON COLUMN public.crop_listings.crop_stage
  IS 'Current lifecycle stage. Determines the advance % charged at checkout: pre_sowing=20%, sowed=30%, growing=40%, pre_harvest=60%, ready_now=100%.';

-- Optional: capture which stage a booking was placed at, for analytics + refunds
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booked_at_stage TEXT,
  ADD COLUMN IF NOT EXISTS advance_pct_applied NUMERIC(5,2);

NOTIFY pgrst, 'reload schema';
