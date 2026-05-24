-- Consumer KYC: add address, government ID, and KYC status fields to consumer_profiles

ALTER TABLE public.consumer_profiles
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS government_id_type TEXT, -- aadhaar | voter_id | driving_license | passport
  ADD COLUMN IF NOT EXISTS government_id_number TEXT,
  ADD COLUMN IF NOT EXISTS government_id_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'incomplete', -- incomplete | pending | approved | rejected
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- RLS policies for consumer self-update (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Consumers can manage their own profile' AND tablename = 'consumer_profiles') THEN
    EXECUTE 'CREATE POLICY "Consumers can manage their own profile" ON public.consumer_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

-- Admins can read/update all consumer profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all consumer profiles' AND tablename = 'consumer_profiles') THEN
    EXECUTE 'CREATE POLICY "Admins can view all consumer profiles" ON public.consumer_profiles FOR SELECT TO authenticated USING (public.get_my_role() = ''admin'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update consumer KYC' AND tablename = 'consumer_profiles') THEN
    EXECUTE 'CREATE POLICY "Admins can update consumer KYC" ON public.consumer_profiles FOR UPDATE TO authenticated USING (public.get_my_role() = ''admin'')';
  END IF;
END $$;
