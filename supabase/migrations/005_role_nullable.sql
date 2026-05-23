-- Allow role to be null so new users land on the "Who are you?" role-select screen
-- instead of being auto-assigned as consumer.
ALTER TABLE public.users
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role SET DEFAULT NULL;

-- Update the check constraint to allow null
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('farmer', 'consumer', 'admin') OR role IS NULL);

-- Update the trigger so new signups get role = NULL (handled in app via role-select)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, phone, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL
  );
  RETURN NEW;
END;
$$;
