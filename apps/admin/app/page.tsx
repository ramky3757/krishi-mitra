import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/supabase-auth';

export default async function Home() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  redirect('/dashboard');
}
