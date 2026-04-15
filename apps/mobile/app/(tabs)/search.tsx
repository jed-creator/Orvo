import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/types';
import type { NormalizedSearchResult } from '@/lib/super-app-types';
import { searchCategory } from '@/lib/super-app-api';
import { SUPER_APP_CONFIG } from '@/lib/super-app-config';
import { OrvoTheme } from '@/constants/orvo-theme';

/**
 * Consumer search — fans out across the native Orvo catalog (local
 * businesses) AND every super-app category (shop, eat, ride, trips,
 * tickets, market, book, compare). This is the "one search bar, every
 * category" narrative from the investor pitch made concrete.
 *
 * Each section renders the top 4 results from its respective endpoint,
 * with a "See all in <Category>" link that routes into the dedicated
 * category screen for the full list. The section is hidden entirely
 * when it has no results — so an empty query fills most sections, and
 * a narrow query (e.g. "nike") might only surface Shop + Compare.
 */

const SUPER_APP_KEYS = [
  'shop',
  'eat',
  'ride',
  'trips',
  'tickets',
  'market',
  'book',
  'compare',
] as const;

interface SearchRow extends Business {
  category: { name: string | null } | null;
}

type CategoryResultMap = Record<string, NormalizedSearchResult[]>;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [businesses, setBusinesses] = useState<SearchRow[]>([]);
  const [superAppResults, setSuperAppResults] = useState<CategoryResultMap>({});
  const [loading, setLoading] = useState(false);

  const fetchBusinesses = async (
    text: string,
    categorySlug?: string,
  ): Promise<SearchRow[]> => {
    let req = supabase
      .from('businesses')
      .select(
        'id, name, slug, description, avg_rating, total_reviews, category:categories(name, slug)',
      )
      .eq('approval_status', 'approved');

    if (text.trim()) {
      req = req.ilike('name', `%${text.trim()}%`);
    }
    if (categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      if (cat) req = req.eq('category_id', cat.id);
    }
    const { data } = await req
      .order('avg_rating', { ascending: false })
      .limit(8);
    return (data ?? []) as unknown as SearchRow[];
  };

  const runSearch = async (text: string, categorySlug?: string) => {
    setLoading(true);
    // Businesses query and all 8 category endpoints run in parallel —
    // the slowest adapter determines total latency, not the sum.
    const [biz, ...categoryLists] = await Promise.all([
      fetchBusinesses(text, categorySlug),
      ...SUPER_APP_KEYS.map((k) => searchCategory(k, text)),
    ]);
    setBusinesses(biz);
    const map: CategoryResultMap = {};
    SUPER_APP_KEYS.forEach((key, i) => {
      map[key] = categoryLists[i] ?? [];
    });
    setSuperAppResults(map);
    setLoading(false);
  };

  useEffect(() => {
    void runSearch('', params.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.category]);

  const nonEmptyCategories = SUPER_APP_KEYS.filter(
    (k) => (superAppResults[k] ?? []).length > 0,
  );
  const hasAnyResults = businesses.length > 0 || nonEmptyCategories.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>
          One search — restaurants, rides, flights, tickets, products, local pros.
        </Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search everything on Orvo…"
          placeholderTextColor={OrvoTheme.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch(query, params.category)}
          autoCapitalize="none"
        />
        {params.category && (
          <Text style={styles.filterPill}>
            Category: {params.category.replace('-', ' ')}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={OrvoTheme.accent} />
        </View>
      ) : !hasAnyResults ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No results across Orvo. Try a different search.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {businesses.length > 0 && (
            <Section title="Local businesses">
              {businesses.map((b) => (
                <Pressable
                  key={b.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/business/[id]',
                      params: { id: b.id },
                    })
                  }
                >
                  <View style={styles.cardBody}>
                    <Text style={styles.bizName}>{b.name}</Text>
                    {b.category?.name && (
                      <Text style={styles.bizCategory}>{b.category.name}</Text>
                    )}
                    {b.description && (
                      <Text style={styles.bizDesc} numberOfLines={2}>
                        {b.description}
                      </Text>
                    )}
                    <Text style={styles.bizRating}>
                      ★ {Number(b.avg_rating).toFixed(1)}{' '}
                      <Text style={styles.bizReviews}>
                        ({b.total_reviews} reviews)
                      </Text>
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Section>
          )}

          {nonEmptyCategories.map((key) => {
            const config = SUPER_APP_CONFIG[key];
            const rows = (superAppResults[key] ?? []).slice(0, 4);
            return (
              <Section
                key={key}
                title={`${config?.emoji ?? ''} ${config?.title ?? key}`}
                onSeeAll={() =>
                  router.push({
                    pathname: '/(super-app)/[category]',
                    params: { category: key },
                  } as never)
                }
              >
                {rows.map((r, idx) => (
                  <UniversalResultCard
                    key={`${r.provider}-${r.externalId}-${idx}`}
                    result={r}
                  />
                ))}
              </Section>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  onSeeAll,
}: {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/**
 * Compact card for a NormalizedSearchResult inside a search section.
 * Smaller than the full-category `ResultCard` — just title, subtitle,
 * price, and the first media asset as a 48x48 thumbnail.
 */
function UniversalResultCard({ result }: { result: NormalizedSearchResult }) {
  const router = useRouter();
  const priceLabel =
    result.price && typeof result.price.amount === 'number'
      ? `$${(result.price.amount / 100).toFixed(2)}`
      : null;

  const thumbnail =
    result.media && result.media[0]?.url ? result.media[0].url : null;

  const handlePress = () => {
    const deepLink =
      typeof result.metadata?.deepLink === 'string'
        ? (result.metadata.deepLink as string)
        : null;
    if (deepLink) {
      const bookMatch = deepLink.match(/^\/book\/(.+)$/);
      if (bookMatch) {
        router.push({
          pathname: '/book/[serviceId]',
          params: { serviceId: bookMatch[1] },
        } as never);
        return;
      }
      const bizMatch = deepLink.match(/^\/business\/(.+)$/);
      if (bizMatch) {
        router.push({
          pathname: '/business/[id]',
          params: { id: bizMatch[1] },
        } as never);
        return;
      }
    }
    if (result.url) {
      void Linking.openURL(result.url);
    }
  };

  return (
    <Pressable style={styles.miniCard} onPress={handlePress}>
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={styles.miniThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.miniThumb, styles.miniThumbFallback]} />
      )}
      <View style={styles.miniBody}>
        <Text style={styles.miniTitle} numberOfLines={1}>
          {result.title}
        </Text>
        {result.subtitle && (
          <Text style={styles.miniSubtitle} numberOfLines={1}>
            {result.subtitle}
          </Text>
        )}
      </View>
      {priceLabel && <Text style={styles.miniPrice}>{priceLabel}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrvoTheme.background },
  header: { padding: 20, paddingBottom: 12, gap: 10 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: OrvoTheme.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: OrvoTheme.mutedForeground,
    lineHeight: 18,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: OrvoTheme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: OrvoTheme.foreground,
  },
  filterPill: {
    fontSize: 13,
    color: OrvoTheme.accent,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: OrvoTheme.mutedForeground,
    textAlign: 'center',
  },
  list: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: OrvoTheme.foreground,
  },
  seeAll: {
    fontSize: 13,
    color: OrvoTheme.accent,
    fontWeight: '600',
  },
  sectionBody: { gap: 10 },
  card: {
    backgroundColor: OrvoTheme.muted,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBody: { padding: 14 },
  bizName: {
    fontSize: 16,
    fontWeight: '600',
    color: OrvoTheme.foreground,
  },
  bizCategory: {
    fontSize: 12,
    color: OrvoTheme.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  bizDesc: {
    fontSize: 13,
    color: OrvoTheme.mutedForeground,
    marginTop: 6,
  },
  bizRating: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 8,
  },
  bizReviews: {
    color: OrvoTheme.mutedForeground,
    fontWeight: '400',
  },
  miniCard: {
    backgroundColor: OrvoTheme.muted,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: OrvoTheme.border,
  },
  miniThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBody: { flex: 1 },
  miniTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: OrvoTheme.foreground,
  },
  miniSubtitle: {
    fontSize: 12,
    color: OrvoTheme.mutedForeground,
    marginTop: 2,
  },
  miniPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: OrvoTheme.foreground,
  },
});
