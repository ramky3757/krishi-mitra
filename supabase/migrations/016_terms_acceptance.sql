-- Track when each user accepted the latest Terms & Conditions.
-- The current TERMS_VERSION lives in apps/mobile/lib/terms.ts.
-- When we update terms, bump the version constant and existing users will be
-- prompted to re-accept on next major action.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.terms_version
  IS 'Last Terms version the user explicitly accepted (e.g. "1.0.0").';

COMMENT ON COLUMN public.users.terms_accepted_at
  IS 'Timestamp of when the user accepted the current terms_version.';

NOTIFY pgrst, 'reload schema';
