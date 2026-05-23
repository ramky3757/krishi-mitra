-- Helper function: returns the current user's role without going through RLS
-- (SECURITY DEFINER bypasses RLS so no recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Allow admin users to read ALL listings regardless of status
DROP POLICY IF EXISTS "Admins can read all listings" ON public.crop_listings;
DROP POLICY IF EXISTS "Active listings are publicly readable" ON public.crop_listings;
CREATE POLICY "Listings readable by owner or admin or if active"
  ON public.crop_listings FOR SELECT TO authenticated
  USING (
    status = 'active'
    OR farmer_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- Allow admin users to update any listing (approve/reject/edit)
DROP POLICY IF EXISTS "Admins can update any listing" ON public.crop_listings;
CREATE POLICY "Admins can update any listing"
  ON public.crop_listings FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'admin');

-- Allow admin users to read all farmer profiles (for KYC review)
DROP POLICY IF EXISTS "Admins can read all farmer profiles" ON public.farmer_profiles;
DROP POLICY IF EXISTS "Farmer profiles are publicly readable" ON public.farmer_profiles;
CREATE POLICY "Farmer profiles readable by authenticated users or admin"
  ON public.farmer_profiles FOR SELECT TO authenticated
  USING (true);

-- Allow admin users to update any farmer profile (approve KYC, grant badges)
DROP POLICY IF EXISTS "Admins can update any farmer profile" ON public.farmer_profiles;
CREATE POLICY "Admins can update any farmer profile"
  ON public.farmer_profiles FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.get_my_role() = 'admin'
  );

-- Allow admin users to read all users
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read their own profile or admins read all" ON public.users;
CREATE POLICY "Users can read their own profile or admins read all"
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- Bookings: readable by consumer, farmer (via listing), or admin
DROP POLICY IF EXISTS "Admins can read all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Consumers can see their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Booking parties can see their bookings" ON public.bookings;
CREATE POLICY "Booking parties can see their bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (
    consumer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.crop_listings cl WHERE cl.id = listing_id AND cl.farmer_id = auth.uid())
    OR public.get_my_role() = 'admin'
  );
