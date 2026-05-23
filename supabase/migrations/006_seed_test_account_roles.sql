-- Set correct roles for dev/test accounts.
-- Safe to run multiple times (UPDATE only affects existing rows).
UPDATE public.users SET role = 'admin'    WHERE email = 'admin@harvestbond.test';
UPDATE public.users SET role = 'farmer'   WHERE email = 'farmer@harvestbond.test';
UPDATE public.users SET role = 'consumer' WHERE email = 'consumer@harvestbond.test';
