import Link from 'next/link';
import {
  SUPER_APP_CATEGORIES_FALLBACK,
  hrefForCategory,
} from '@/lib/services/super-app.service';

/**
 * Top-level navigation strip that exposes every super-app category
 * as a link. Consumed by the existing top navigation (see
 * `app/page.tsx`) per the plan — this component owns the category
 * list, and the host header owns the brand + auth actions.
 *
 * The category list is read from `SUPER_APP_CATEGORIES_FALLBACK`
 * rather than fetched from Supabase because the nav renders on
 * every page and must be deterministic, cache-friendly, and
 * first-paint ready. The canonical source of truth is still the
 * `super_app_categories` table — the fallback constant is kept in
 * lockstep with the seed in `super-app.service.ts`.
 */
export function SuperAppNav() {
  return (
    <nav
      aria-label="Super-app categories"
      data-testid="super-app-nav"
      className="hidden items-center gap-4 text-sm md:flex"
    >
      {SUPER_APP_CATEGORIES_FALLBACK.map((category) => (
        <Link
          key={category.key}
          href={hrefForCategory(category.key)}
          data-testid="super-app-nav-link"
          className="text-zinc-600 transition hover:text-brand-primary"
        >
          {category.title}
        </Link>
      ))}
    </nav>
  );
}
