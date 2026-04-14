import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  fetchSuperAppCategories,
  hrefForCategory,
  SUPER_APP_CATEGORIES_FALLBACK,
  type SuperAppCategory,
} from '@/lib/services/super-app.service';

export const metadata = { title: 'Explore' };

/**
 * Super-app home hub. Server component that renders a 2×N grid of
 * category tiles — one per enabled row in `super_app_categories`.
 *
 * DB access is wrapped twice: `fetchSuperAppCategories` catches
 * query errors/empty results, and the outer try/catch here catches
 * `createClient()` itself (missing env vars, network blips). If
 * anything goes wrong the fallback seed is used so the Playwright
 * smoke test and the "first-run, no env" experience both see a
 * fully-populated grid.
 */
export default async function ExploreHubPage() {
  let categories: SuperAppCategory[];
  try {
    const client = await createClient();
    categories = await fetchSuperAppCategories(client);
  } catch {
    categories = [...SUPER_APP_CATEGORIES_FALLBACK];
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-primary">
          Explore
        </h1>
        <p className="mt-2 text-zinc-600">
          Every way you can use Orvo — shop, eat, ride, plan trips,
          and more.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.key}
            href={hrefForCategory(category.key)}
            data-testid="category-tile"
            className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-brand-primary hover:shadow-sm"
          >
            <h2 className="text-lg font-semibold text-brand-primary">
              {category.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Open {category.title.toLowerCase()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
