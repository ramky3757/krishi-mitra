-- Payout schedule for farmers
-- Decision: 70% of advance released to farmer 48hr after booking (for sowing).
--           Remaining released 48hr after delivery is confirmed.
-- This funds the sowing while leaving buffer for refunds in the cooling window.

ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS advance_release_pct NUMERIC(5,2) NOT NULL DEFAULT 70.0,
  ADD COLUMN IF NOT EXISTS advance_release_delay_hours INT NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS final_release_delay_hours INT NOT NULL DEFAULT 48;

COMMENT ON COLUMN public.platform_config.advance_release_pct
  IS 'When the consumer pays the booking advance, this % of the farmer payout is released after the cooling period. Default 70%.';

COMMENT ON COLUMN public.platform_config.advance_release_delay_hours
  IS 'Cooling-period delay before the advance portion is released to the farmer. Default 48h.';

COMMENT ON COLUMN public.platform_config.final_release_delay_hours
  IS 'Dispute window after delivery before the remaining farmer payout is released. Default 48h.';

-- payouts table — used once Cashfree Payouts API is integrated
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('advance_release', 'final_release')),
  amount NUMERIC(10, 2) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'released', 'failed', 'held', 'cancelled')),
  hold_reason TEXT,
  cashfree_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_status_scheduled ON public.payouts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payouts_booking ON public.payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_payouts_farmer ON public.payouts(farmer_id);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Farmers can see their own payouts' AND tablename = 'payouts') THEN
    EXECUTE 'CREATE POLICY "Farmers can see their own payouts" ON public.payouts FOR SELECT TO authenticated USING (farmer_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see all payouts' AND tablename = 'payouts') THEN
    EXECUTE 'CREATE POLICY "Admins can see all payouts" ON public.payouts FOR SELECT TO authenticated USING (public.get_my_role() = ''admin'')';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
