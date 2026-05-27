// Supabase Edge Function: send-welcome-email
// Triggered from the mobile app after successful KYC submission.
// Sends a branded welcome email via Resend that includes:
//   - Personalized greeting
//   - What they just accepted (T&C summary by role)
//   - Links to view full terms
//   - Next steps (what they can do now)
//
// Deploy:  supabase functions deploy send-welcome-email
// Set the Resend API key as a secret:
//   supabase secrets set RESEND_API_KEY=re_xxx

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Krishi Mitra <noreply@krishimitra.app>';
const APP_URL = 'https://krishimitra.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Role = 'farmer' | 'consumer';

function buildEmailHtml(opts: { name: string; role: Role; termsVersion: string }) {
  const { name, role, termsVersion } = opts;

  const isFarmer = role === 'farmer';

  const acceptedDocs = isFarmer
    ? ['Terms of Service', 'Farmer Terms', 'Privacy Policy']
    : ['Terms of Service', 'Consumer Terms', 'Privacy Policy'];

  const keyPoints = isFarmer
    ? [
        ['8% commission', 'on each completed transaction (you keep 92%)'],
        ['Milestone payouts', '30% on booking, 40% on sowing, 30% on delivery'],
        ['Forward contract', 'Booking price is binding — market changes don\'t apply'],
        ['Re-list anytime', 'If a consumer cancels post-harvest, you keep the crop + 70%'],
      ]
    : [
        ['Stage-based advance', 'Pay just 20% when booking early, more closer to harvest'],
        ['Refund tiers', '100% within 48h, 80% before sowing, 0% after harvest'],
        ['3% platform fee', 'Covers payment processing + farmer verification'],
        ['Farm visits', 'Visit the farm growing your food up to 2 times'],
      ];

  const nextSteps = isFarmer
    ? [
        '🌾 Post your first crop listing',
        '📸 Add farm photos and crop details',
        '⏳ Wait 24-48 hr for KYC approval',
      ]
    : [
        '🔍 Browse fresh crops from verified farmers',
        '🌾 Pre-book a crop you like',
        '📦 Track its growth from sowing to harvest',
      ];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome to Krishi Mitra</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <!-- Header -->
    <div style="background:#1a6b3c;border-radius:16px;padding:32px 24px;text-align:center;color:white;">
      <div style="font-size:48px;line-height:1;margin-bottom:8px;">🌾</div>
      <h1 style="margin:0;font-size:28px;font-weight:800;">Welcome to Krishi Mitra, ${escapeHtml(name)}!</h1>
      <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">${isFarmer ? '🧑‍🌾 You\'re registered as a Farmer' : '🛒 You\'re registered as a Consumer'}</p>
    </div>

    <!-- Confirmation -->
    <div style="background:white;border-radius:16px;padding:24px;margin-top:16px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">✅ KYC submitted successfully</h2>
      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
        Thanks for completing your profile. Our team will verify your details within 24–48 hours.
        ${isFarmer ? "You can post your first crop listing as soon as you're approved." : "You can start browsing and pre-booking crops right away."}
      </p>
    </div>

    <!-- What you accepted -->
    <div style="background:white;border-radius:16px;padding:24px;margin-top:16px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">📜 What you've agreed to</h2>
      <p style="margin:0 0 12px;color:#4b5563;font-size:14px;">
        On ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}, you accepted Krishi Mitra's policies (version ${termsVersion}):
      </p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
        ${acceptedDocs.map(d => `<li>${d}</li>`).join('')}
      </ul>
      <div style="margin-top:16px;">
        <a href="${APP_URL}/terms" style="display:inline-block;padding:10px 16px;background:#f3f4f6;color:#1a6b3c;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;">
          View full Terms →
        </a>
      </div>
    </div>

    <!-- Key things to know -->
    <div style="background:white;border-radius:16px;padding:24px;margin-top:16px;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">💡 Key things to know</h2>
      ${keyPoints.map(([title, body]) => `
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
          <div style="font-weight:700;color:#1a6b3c;font-size:14px;margin-bottom:2px;">${title}</div>
          <div style="color:#4b5563;font-size:13px;line-height:1.5;">${body}</div>
        </div>
      `).join('')}
    </div>

    <!-- Next steps -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;margin-top:16px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#166534;">🚀 What's next</h2>
      <ol style="margin:0;padding-left:20px;color:#166534;font-size:14px;line-height:1.8;">
        ${nextSteps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <div style="margin-top:16px;text-align:center;">
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:#1a6b3c;color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">
          Open Krishi Mitra
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;padding:16px;line-height:1.6;">
      <p style="margin:0 0 4px;">Questions? Email us at <a href="mailto:support@krishimitra.app" style="color:#1a6b3c;">support@krishimitra.app</a></p>
      <p style="margin:0;">Krishi Mitra · From Seed to Kitchen · Operated by TARA TECHMONKS</p>
    </div>

  </div>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { email, name, role, termsVersion } = await req.json();

    if (!email || !role || (role !== 'farmer' && role !== 'consumer')) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = buildEmailHtml({
      name: name || 'there',
      role,
      termsVersion: termsVersion || '1.0.0',
    });

    const subject = role === 'farmer'
      ? '🌾 Welcome to Krishi Mitra — your farmer account is set up'
      : '🛒 Welcome to Krishi Mitra — start pre-booking fresh crops';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend API error: ${resendRes.status} — ${errBody}`);
    }

    const data = await resendRes.json();
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-welcome-email error', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
