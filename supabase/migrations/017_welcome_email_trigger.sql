-- Welcome-on-KYC email system using Postgres triggers + pg_net + Resend.
-- No Edge Functions required — entirely server-side in Supabase.
--
-- After running this migration, set the Resend API key once via Vault:
--   SELECT vault.create_secret('re_your_actual_key_here', 'resend_api_key');
--
-- Flow:
--   1. User submits KYC → row inserted into farmer_profiles or consumer_profiles
--   2. Trigger fires → reads user email from public.users → builds HTML
--   3. pg_net calls Resend → branded role-specific welcome email sent

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Helper: build the welcome email HTML for a given role
CREATE OR REPLACE FUNCTION public.build_welcome_email_html(
  p_name TEXT,
  p_role TEXT,
  p_terms_version TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $func$
DECLARE
  v_role_badge TEXT;
  v_role_terms_link TEXT;
  v_role_terms_label TEXT;
  v_intro TEXT;
  v_key_points TEXT;
  v_next_steps TEXT;
BEGIN
  IF p_role = 'farmer' THEN
    v_role_badge := '🧑‍🌾 You are registered as a Farmer';
    v_role_terms_link := 'https://krishimitra.app/terms?only=farmer';
    v_role_terms_label := 'Farmer Terms';
    v_intro := 'Thanks for completing your farmer profile. Our team will verify your details within 24-48 hours. You can post your first crop listing as soon as you are approved.';
    v_key_points :=
      '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">8% commission</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">on each completed transaction (you keep 92%)</div>' ||
      '</div>' ||
      '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">Milestone payouts</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">30% on booking, 40% on sowing, 30% on delivery</div>' ||
      '</div>' ||
      '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">Forward contract</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">Booking price is binding — market changes don\\''t apply</div>' ||
      '</div>' ||
      '<div>' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">Re-list anytime</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">If consumer cancels post-harvest you keep crop + 70%</div>' ||
      '</div>';
    v_next_steps :=
      '<li>🌾 Post your first crop listing</li>' ||
      '<li>📸 Add farm photos and crop details</li>' ||
      '<li>⏳ Wait 24-48 hr for KYC approval</li>';
  ELSE
    v_role_badge := '🛒 You are registered as a Consumer';
    v_role_terms_link := 'https://krishimitra.app/terms?only=consumer';
    v_role_terms_label := 'Consumer Terms';
    v_intro := 'Thanks for completing your profile. Our team will verify your details within 24-48 hours. You can start browsing and pre-booking crops right away.';
    v_key_points :=
      '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">Stage-based advance</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">Pay just 20% when booking early, more closer to harvest</div>' ||
      '</div>' ||
      '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">Refund tiers</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">100% within 48h, 80% before sowing, 0% after harvest</div>' ||
      '</div>' ||
      '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">3% platform fee</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">Covers payment processing + farmer verification</div>' ||
      '</div>' ||
      '<div>' ||
        '<div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">Farm visits</div>' ||
        '<div style="color:#4b5563;font-size:13px;line-height:1.5;">Visit the farm growing your food up to 2 times</div>' ||
      '</div>';
    v_next_steps :=
      '<li>🔍 Browse fresh crops from verified farmers</li>' ||
      '<li>🌾 Pre-book a crop you like</li>' ||
      '<li>📦 Track its growth from sowing to harvest</li>';
  END IF;

  RETURN
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>' ||
    '<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f9fafb;color:#111827;">' ||
    '<div style="max-width:600px;margin:0 auto;padding:24px;">' ||

    '<div style="background:#1a6b3c;border-radius:16px;padding:32px 24px;text-align:center;color:white;">' ||
      '<div style="font-size:48px;line-height:1;margin-bottom:8px;">🌾</div>' ||
      '<h1 style="margin:0;font-size:24px;font-weight:800;">Welcome to Krishi Mitra, ' || COALESCE(p_name, 'there') || '!</h1>' ||
      '<p style="margin:8px 0 0;color:#bbf7d0;font-size:13px;">' || v_role_badge || '</p>' ||
    '</div>' ||

    '<div style="background:white;border-radius:16px;padding:24px;margin-top:16px;">' ||
      '<h2 style="margin:0 0 12px;font-size:18px;color:#111827;">✅ KYC submitted successfully</h2>' ||
      '<p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">' || v_intro || '</p>' ||
    '</div>' ||

    '<div style="background:white;border-radius:16px;padding:24px;margin-top:16px;">' ||
      '<h2 style="margin:0 0 12px;font-size:18px;color:#111827;">📜 What you have agreed to</h2>' ||
      '<p style="margin:0 0 12px;color:#4b5563;font-size:14px;">On ' || to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY') ||
      ', you accepted Krishi Mitra policies (version ' || p_terms_version || '):</p>' ||
      '<ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">' ||
        '<li><a href="https://krishimitra.app/terms?only=common" style="color:#1a6b3c;">Terms of Service</a></li>' ||
        '<li><a href="' || v_role_terms_link || '" style="color:#1a6b3c;">' || v_role_terms_label || '</a></li>' ||
        '<li><a href="https://krishimitra.app/terms?only=privacy" style="color:#1a6b3c;">Privacy Policy</a></li>' ||
      '</ul>' ||
    '</div>' ||

    '<div style="background:white;border-radius:16px;padding:24px;margin-top:16px;">' ||
      '<h2 style="margin:0 0 16px;font-size:18px;color:#111827;">💡 Key things to know</h2>' ||
      v_key_points ||
    '</div>' ||

    '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;margin-top:16px;">' ||
      '<h2 style="margin:0 0 12px;font-size:18px;color:#166534;">🚀 What is next</h2>' ||
      '<ol style="margin:0;padding-left:20px;color:#166534;font-size:14px;line-height:1.8;">' || v_next_steps || '</ol>' ||
      '<div style="margin-top:16px;text-align:center;">' ||
        '<a href="https://krishimitra.app" style="display:inline-block;padding:12px 24px;background:#1a6b3c;color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">Open Krishi Mitra</a>' ||
      '</div>' ||
    '</div>' ||

    '<div style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;padding:16px;line-height:1.6;">' ||
      '<p style="margin:0 0 4px;">Questions? <a href="mailto:support@krishimitra.app" style="color:#1a6b3c;">support@krishimitra.app</a></p>' ||
      '<p style="margin:0;">Krishi Mitra · From Seed to Kitchen · TARA TECHMONKS</p>' ||
    '</div>' ||

    '</div></body></html>';
END;
$func$;

-- 3. The trigger function — actually sends the email via Resend
CREATE OR REPLACE FUNCTION public.send_kyc_welcome_email(
  p_user_id UUID,
  p_role TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_terms_version TEXT;
  v_html TEXT;
  v_subject TEXT;
  v_resend_key TEXT;
  v_response_id BIGINT;
BEGIN
  -- Fetch user email + name
  SELECT email, COALESCE(full_name, 'there'), COALESCE(terms_version, '1.0.0')
    INTO v_email, v_name, v_terms_version
  FROM public.users
  WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RAISE LOG 'send_kyc_welcome_email: no email for user %', p_user_id;
    RETURN;
  END IF;

  -- Read Resend API key from Vault
  SELECT decrypted_secret INTO v_resend_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key'
  LIMIT 1;

  IF v_resend_key IS NULL THEN
    RAISE LOG 'send_kyc_welcome_email: resend_api_key not set in vault';
    RETURN;
  END IF;

  v_html := public.build_welcome_email_html(v_name, p_role, v_terms_version);

  v_subject := CASE WHEN p_role = 'farmer'
    THEN '🌾 Welcome to Krishi Mitra — your farmer account is being verified'
    ELSE '🛒 Welcome to Krishi Mitra — start pre-booking fresh crops'
  END;

  -- Async HTTP POST to Resend
  SELECT net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_resend_key
    ),
    body := jsonb_build_object(
      'from', 'Krishi Mitra <noreply@krishimitra.app>',
      'to', jsonb_build_array(v_email),
      'subject', v_subject,
      'html', v_html
    )
  ) INTO v_response_id;

  RAISE LOG 'send_kyc_welcome_email: queued % to % (request %)', p_role, v_email, v_response_id;
END;
$func$;

-- 4. Triggers: fire on KYC submission

-- Farmer: when a farmer_profiles row is inserted with kyc_status = 'pending'
CREATE OR REPLACE FUNCTION public.trg_farmer_kyc_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  IF NEW.kyc_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.kyc_status IS DISTINCT FROM 'pending') THEN
    PERFORM public.send_kyc_welcome_email(NEW.user_id, 'farmer');
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS farmer_kyc_welcome_email ON public.farmer_profiles;
CREATE TRIGGER farmer_kyc_welcome_email
  AFTER INSERT OR UPDATE ON public.farmer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_farmer_kyc_email();

-- Consumer: same logic on consumer_profiles
CREATE OR REPLACE FUNCTION public.trg_consumer_kyc_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  IF NEW.kyc_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.kyc_status IS DISTINCT FROM 'pending') THEN
    PERFORM public.send_kyc_welcome_email(NEW.user_id, 'consumer');
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS consumer_kyc_welcome_email ON public.consumer_profiles;
CREATE TRIGGER consumer_kyc_welcome_email
  AFTER INSERT OR UPDATE ON public.consumer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_consumer_kyc_email();
