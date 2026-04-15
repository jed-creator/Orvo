import { ProfileNav } from '@/components/super-app/profile-nav';

/**
 * /profile/* layout (Phase 8 UI).
 *
 * Wraps every profile sub-route with a shared header + tab strip.
 * Auth is already enforced by the parent `(dashboard)/layout.tsx`,
 * so this layer is purely presentational.
 */
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Your account
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your profile, points, wallet, notifications, and privacy
          all in one place.
        </p>
      </header>
      <ProfileNav />
      <div>{children}</div>
    </div>
  );
}
