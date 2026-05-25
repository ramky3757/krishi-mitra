import { getAdminSession } from '@/lib/supabase-auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const displayName = session?.profile?.full_name || session?.profile?.email || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="md:flex md:h-screen bg-gray-50">
      <Sidebar displayName={displayName} initials={initials} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
