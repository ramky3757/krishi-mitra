-- Add 'archived' status to crop_listings so admin can take listings out of
-- the live catalog at end of season without deleting historical data.
-- Consumers won't see archived listings; admin can re-activate when next
-- season starts.

ALTER TABLE public.crop_listings
  DROP CONSTRAINT IF EXISTS crop_listings_status_check;

ALTER TABLE public.crop_listings
  ADD CONSTRAINT crop_listings_status_check
  CHECK (status IN (
    'draft',
    'pending_approval',
    'active',
    'fully_booked',
    'harvested',
    'completed',
    'cancelled',
    'archived'
  ));

NOTIFY pgrst, 'reload schema';
