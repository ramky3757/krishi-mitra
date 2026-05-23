-- Allow authenticated users to insert their own row in public.users
-- (needed when the on_auth_user_created trigger didn't fire, e.g. accounts
-- created directly in the Supabase dashboard)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Upsert the public.users row for the test farmer account in case the
-- trigger never ran for it.
INSERT INTO public.users (id, email, full_name, role, phone)
SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'full_name', ''), 'farmer', au.phone
FROM auth.users au
WHERE au.email = 'farmer@harvestbond.test'
ON CONFLICT (id) DO UPDATE SET role = 'farmer';
