import { supabase } from './supabase';
import { TERMS_VERSION } from './terms';

/**
 * Fire the welcome email via Supabase Edge Function.
 * This is fire-and-forget — never block the user's KYC submission on email
 * sending. If the function fails (network, Resend limit, etc.) we just log it
 * and the user still gets their account set up.
 */
export async function sendWelcomeEmail(opts: {
  email: string;
  name: string;
  role: 'farmer' | 'consumer';
}) {
  try {
    const { error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: opts.email,
        name: opts.name,
        role: opts.role,
        termsVersion: TERMS_VERSION,
      },
    });
    if (error) console.warn('Welcome email send failed:', error.message);
  } catch (e) {
    console.warn('Welcome email send error:', e);
  }
}
