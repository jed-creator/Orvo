import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signoutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  const isProfileIncomplete = !profile?.first_name || !profile?.last_name;
  const isProvider = profile?.role === 'provider';

  // For providers, also check if they have a business yet
  let hasBusiness = false;
  if (isProvider) {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
    hasBusiness = Boolean(biz);
  }

  const navLinks: { href: string; label: string }[] = [
    { href: '/dashboard', label: 'Dashboard' },
  ];
  if (isProvider) {
    navLinks.push(
      { href: '/dashboard/calendar', label: 'Calendar' },
      { href: '/dashboard/bookings', label: 'Bookings' },
      { href: '/dashboard/services', label: 'Services' },
      { href: '/dashboard/forms', label: 'Forms' },
      { href: '/dashboard/staff', label: 'Staff' },
      { href: '/dashboard/availability', label: 'Hours' },
      { href: '/dashboard/reviews', label: 'Reviews' },
      { href: '/dashboard/analytics', label: 'Analytics' },
      { href: '/dashboard/stripe', label: 'Payments' },
      { href: '/dashboard/business', label: 'Business' },
      { href: '/dashboard/settings', label: 'Settings' },
    );
  }
  navLinks.push({ href: '/profile', label: 'Profile' });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight text-brand-primary"
          >
            Serva
          </Link>
          <nav className="flex items-center gap-5">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                {l.label}
              </Link>
            ))}
            <span className="text-sm text-zinc-500 hidden md:inline">
              {profile?.first_name ?? user.email}
            </span>
            <form action={signoutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {isProfileIncomplete && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-amber-900">
              Complete your profile to unlock the full Serva experience.{' '}
              <Link href="/profile" className="font-medium underline">
                Finish now →
              </Link>
            </div>
          </div>
        )}
        {isProvider && !hasBusiness && (
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-blue-900">
              You haven&apos;t set up your business yet.{' '}
              <Link
                href="/dashboard/business/new"
                className="font-medium underline"
              >
                Create it now →
              </Link>
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
