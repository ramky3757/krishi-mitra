-- Trust-building fields on the farmer profile.
-- Surfaced to consumers on the listing detail page so they feel confident
-- pre-booking from a farmer they don't know personally.

ALTER TABLE public.farmer_profiles
  ADD COLUMN IF NOT EXISTS years_of_experience INT,
  ADD COLUMN IF NOT EXISTS crop_varieties TEXT[],           -- e.g. ['rice', 'wheat', 'tomato']
  ADD COLUMN IF NOT EXISTS farming_certifications TEXT[],   -- e.g. ['organic', 'fair_trade']
  ADD COLUMN IF NOT EXISTS languages TEXT[],                -- e.g. ['hindi', 'telugu', 'english']
  ADD COLUMN IF NOT EXISTS bio TEXT,                        -- short story / about
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS land_size_acres NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS family_lineage_generations INT;  -- "3rd generation farmer"

COMMENT ON COLUMN public.farmer_profiles.years_of_experience IS 'Total years actively farming.';
COMMENT ON COLUMN public.farmer_profiles.crop_varieties IS 'Distinct crop names the farmer has grown.';
COMMENT ON COLUMN public.farmer_profiles.farming_certifications IS 'Certifications: organic, fair_trade, gmp, etc.';
COMMENT ON COLUMN public.farmer_profiles.bio IS 'Short personal story (max ~300 chars).';
COMMENT ON COLUMN public.farmer_profiles.family_lineage_generations IS 'e.g. 3 = "3rd generation farmer".';

NOTIFY pgrst, 'reload schema';
