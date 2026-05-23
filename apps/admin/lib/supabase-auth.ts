import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function getAdminSession() {
  const client = await createAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  // Verify admin role via service role client
  const { supabase } = await import('./supabase');
  const { data } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') return null;
  return { user, profile: data };
}
