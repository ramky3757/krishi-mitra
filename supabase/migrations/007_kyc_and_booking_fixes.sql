-- =========================================
-- 1. Approve KYC for the test farmer account
-- =========================================
UPDATE public.farmer_profiles
SET
  kyc_status = 'approved',
  verification_badges = ARRAY['id_verified', 'land_verified']
WHERE user_id = (
  SELECT id FROM public.users WHERE email = 'farmer@harvestbond.test'
);

-- =========================================
-- 2. Ensure the bookings SELECT policy covers
--    farmers reading bookings on their listings.
--    (The existing policy already does this, but
--    renaming it for clarity and idempotency.)
-- =========================================
DROP POLICY IF EXISTS "Consumers can see their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Booking parties can see their bookings" ON public.bookings;

CREATE POLICY "Booking parties can see their bookings"
  ON public.bookings FOR SELECT TO authenticated USING (
    -- Consumer sees their own bookings
    consumer_id = auth.uid()
    OR
    -- Farmer sees bookings on their listings
    EXISTS (
      SELECT 1 FROM public.crop_listings cl
      WHERE cl.id = listing_id AND cl.farmer_id = auth.uid()
    )
    OR
    -- Admin sees all bookings
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================
-- 3. Admin can read all bookings (for management)
-- =========================================
DROP POLICY IF EXISTS "Admins can read all bookings" ON public.bookings;
CREATE POLICY "Admins can read all bookings"
  ON public.bookings FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
