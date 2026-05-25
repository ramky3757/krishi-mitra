-- Logistics + commission model
-- Delivery method, fees breakdown, farmer payout

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup', -- pickup | delivery
  ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2),                -- qty_kg × price_per_kg_final
  ADD COLUMN IF NOT EXISTS platform_fee_farmer NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_consumer NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS farmer_payout NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_consumer_pays NUMERIC(10, 2);

-- Backfill existing rows with sensible defaults so old data still queries cleanly
UPDATE public.bookings
SET
  delivery_method   = COALESCE(delivery_method, 'pickup'),
  delivery_charge   = COALESCE(delivery_charge, 0),
  subtotal          = COALESCE(subtotal, COALESCE(advance_amount, 0) + COALESCE(final_amount, 0))
WHERE subtotal IS NULL;

-- Platform fee config (could be made per-region/per-category later)
-- Stored as a singleton row to allow easy admin changes without code deploy
CREATE TABLE IF NOT EXISTS public.platform_config (
  id INT PRIMARY KEY DEFAULT 1,
  farmer_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  consumer_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  default_delivery_charge_per_kg NUMERIC(10,2) NOT NULL DEFAULT 15.0,
  free_pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT singleton_config CHECK (id = 1)
);

INSERT INTO public.platform_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Anyone can read config (needed by app to display fee breakdown)
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform config readable by all' AND tablename = 'platform_config') THEN
    EXECUTE 'CREATE POLICY "Platform config readable by all" ON public.platform_config FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update platform config' AND tablename = 'platform_config') THEN
    EXECUTE 'CREATE POLICY "Admins can update platform config" ON public.platform_config FOR UPDATE TO authenticated USING (public.get_my_role() = ''admin'')';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
