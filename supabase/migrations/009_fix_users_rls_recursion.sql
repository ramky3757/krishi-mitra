-- Fix infinite recursion in public.users policies.
-- The "Admins can read all users" policy queried public.users from within
-- a public.users RLS policy, causing infinite recursion.
--
-- Solution: create a SECURITY DEFINER helper function that checks the role
-- without going through RLS, then use it in all policies that need an admin check.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Recreate users SELECT policy: own row OR admin
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Users can read their own profile or admins read all"
  ON public.users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
  );
