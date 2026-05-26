-- Aligned refund + milestone-based payout model
-- Refund tiers (consumer protection):
--   Within 48hr of booking ........... 100% refund
--   After 48hr, before sowing ........  80%
--   After sowing, before flowering ...  50%
--   After flowering, before harvest ..  25%
--   After harvest ....................   0%
-- Payout schedule (farmer cashflow tied to verifiable progress):
--   Booking + 48hr ............ 30% of farmer payout (seed money)
--   Sowing milestone .......... +40% (now 70%)
--   Delivery confirmed + 48hr . remaining 30%

ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS advance_release_pct_initial NUMERIC(5,2) NOT NULL DEFAULT 30.0,
  ADD COLUMN IF NOT EXISTS advance_release_pct_on_sowing NUMERIC(5,2) NOT NULL DEFAULT 40.0,
  ADD COLUMN IF NOT EXISTS refund_within_48h_pct NUMERIC(5,2) NOT NULL DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS refund_before_sowing_pct NUMERIC(5,2) NOT NULL DEFAULT 80.0,
  ADD COLUMN IF NOT EXISTS refund_before_flowering_pct NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  ADD COLUMN IF NOT EXISTS refund_before_harvest_pct NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  ADD COLUMN IF NOT EXISTS refund_after_harvest_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0;

-- The old advance_release_pct (introduced in 013) is now replaced by the two
-- _initial / _on_sowing columns above. Keep it for backward read compatibility
-- but it should no longer be used by the payout cron.
COMMENT ON COLUMN public.platform_config.advance_release_pct
  IS 'DEPRECATED: use advance_release_pct_initial + advance_release_pct_on_sowing instead.';

NOTIFY pgrst, 'reload schema';
