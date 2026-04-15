import { CategoryScreen } from '@/components/super-app/category-screen';
import { BOOK_SUB_FILTERS } from '@/lib/super-app-config';

/**
 * Book tile — the only super-app category that ships with sub-filter
 * chips today. Beauty+wellness, fitness, general, home services, and
 * pet care each map to one or more booking adapter categories on the
 * web side via `BOOK_SUB_FILTERS` in `booking.service.ts`. The "All"
 * tab is the default and fans out across every category.
 */
export default function BookScreen() {
  return (
    <CategoryScreen categoryKey="book" subFilters={BOOK_SUB_FILTERS} />
  );
}
