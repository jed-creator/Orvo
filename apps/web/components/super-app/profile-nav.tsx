'use client';

/**
 * Profile sub-navigation tab strip (Phase 8 UI).
 *
 * Rendered by `(dashboard)/profile/layout.tsx` above every profile
 * sub-route. Uses `usePathname()` so the active tab is highlighted
 * without the parent layout having to thread state through.
 *
 * Kept thin on purpose — the full styling and accessibility layers
 * live in CSS, not JS, so the parent server component owns the data
 * and this client island only owns the highlight.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS: { href: string; label: string }[] = [
  { href: '/profile', label: 'Profile' },
  { href: '/profile/points', label: 'Points' },
  { href: '/profile/wallet', label: 'Wallet' },
  { href: '/profile/notifications', label: 'Notifications' },
  { href: '/profile/accessibility', label: 'Accessibility' },
  { href: '/profile/privacy', label: 'Privacy' },
  { href: '/profile/household', label: 'Household' },
];

export function ProfileNav() {
  const pathname = usePathname();

  return (
    <nav
      data-testid="profile-nav"
      aria-label="Profile sections"
      className="border-b border-zinc-200"
    >
      <ul className="-mb-px flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-block border-b-2 px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-brand-primary font-medium text-brand-primary'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
