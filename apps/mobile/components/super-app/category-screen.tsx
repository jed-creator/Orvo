/**
 * Reusable super-app category screen.
 *
 * Every category (shop, eat, ride, trips, tickets, market, book,
 * compare) has a one-line route file under `app/(super-app)/` that
 * imports this component and passes a config key. The screen runs a
 * fan-out search against `/api/<category>/search` via
 * `super-app-api.ts` and renders results in a `FlatList`.
 *
 * The scaffold is intentionally minimal — real per-category UX (seat
 * maps, itinerary builder, dietary filters, etc.) lands in Phase 6+
 * per the Feature Outline. This is the mobile counterpart to
 * `apps/web/app/(<category>)/<category>/page.tsx`.
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { OrvoTheme } from '@/constants/orvo-theme';
import { searchCategory } from '@/lib/super-app-api';
import type { NormalizedSearchResult } from '@/lib/super-app-types';
import {
  SUPER_APP_CONFIG,
  type CategorySubFilter,
} from '@/lib/super-app-config';

interface CategoryScreenProps {
  categoryKey: string;
  /**
   * Optional horizontal chip row of sub-filter tabs. When provided, the
   * screen renders a chip per filter above the results and re-runs the
   * search whenever the user selects a new one. The first entry is the
   * default selection. Currently used by the Book tile with
   * `BOOK_SUB_FILTERS`; other tiles omit this prop.
   */
  subFilters?: readonly CategorySubFilter[];
}

export function CategoryScreen({
  categoryKey,
  subFilters,
}: CategoryScreenProps) {
  const config = SUPER_APP_CONFIG[categoryKey];
  const defaultFilter = subFilters?.[0]?.key ?? 'all';
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(defaultFilter);
  const [results, setResults] = useState<NormalizedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Kick off an empty-query search on mount so the screen shows
  // whatever the adapters return for "no filter" (currently nothing
  // from stubs — but the reference adapters may return mock data).
  useEffect(() => {
    void runSearch(query, activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, activeFilter]);

  async function runSearch(text: string, filterKey: string) {
    setLoading(true);
    setSearched(true);
    const data = await searchCategory(categoryKey, text, filterKey);
    setResults(data);
    setLoading(false);
  }

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Unknown category: {categoryKey}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: config.title }} />

      <View style={styles.header}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${config.title.toLowerCase()}…`}
          placeholderTextColor={OrvoTheme.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch(query, activeFilter)}
          autoCapitalize="none"
        />
      </View>

      {subFilters && subFilters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterRowContainer}
        >
          {subFilters.map((f) => {
            const active = f.key === activeFilter;
            return (
              <Pressable
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    active && styles.chipLabelActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={OrvoTheme.accent} />
        </View>
      ) : !searched ? null : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No results yet. Try a different search, or check back once
            real adapters are connected.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.provider}-${item.externalId}-${idx}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ResultCard result={item} />}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Translate a server-provided `metadata.deepLink` string into an
 * expo-router path. The server side picks this format deliberately so
 * the mobile client can route internally instead of bouncing out to a
 * browser. Anything we can't recognize falls through to
 * `Linking.openURL(result.url)` — that's the right behavior for
 * adapter fixtures pointing at real external sites.
 */
function routeForResult(
  result: NormalizedSearchResult,
): { pathname: string; params?: Record<string, string> } | null {
  const deepLink =
    typeof result.metadata?.deepLink === 'string'
      ? (result.metadata.deepLink as string)
      : null;
  if (!deepLink) return null;
  // `/book/<serviceId>` → Book a native service
  const bookMatch = deepLink.match(/^\/book\/(.+)$/);
  if (bookMatch) {
    return {
      pathname: '/book/[serviceId]',
      params: { serviceId: bookMatch[1] },
    };
  }
  // `/business/<id>` → Business detail
  const bizMatch = deepLink.match(/^\/business\/(.+)$/);
  if (bizMatch) {
    return {
      pathname: '/business/[id]',
      params: { id: bizMatch[1] },
    };
  }
  return null;
}

function ResultCard({ result }: { result: NormalizedSearchResult }) {
  const router = useRouter();

  const priceLabel =
    result.price && typeof result.price.amount === 'number'
      ? `$${(result.price.amount / 100).toFixed(2)}${
          result.price.currency && result.price.currency !== 'USD'
            ? ` ${result.price.currency}`
            : ''
        }`
      : null;

  // `metadata.description` is our escape hatch — the canonical shape has
  // no first-class description field, but a few routes (notably book
  // services and market merchants) place one there for richer cards.
  const description =
    typeof result.metadata?.description === 'string'
      ? (result.metadata.description as string)
      : undefined;

  // First media asset, when present. Seed, reference adapters, and the
  // Orvo-native book route all populate `media[0].url` with a real
  // image URL — most use Picsum placeholders sized for cards.
  const mediaUrl =
    result.media && result.media.length > 0 && result.media[0].url
      ? result.media[0].url
      : null;

  const handlePress = () => {
    const internal = routeForResult(result);
    if (internal) {
      // Expo-router's typed href helper — the cast is because
      // NormalizedSearchResult is pure data and can't express the
      // typed href union at compile time.
      router.push(internal as never);
      return;
    }
    if (result.url) {
      void Linking.openURL(result.url);
    }
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {mediaUrl && (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.cardImage}
          resizeMode="cover"
          accessibilityLabel={result.title}
        />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.provider}>{result.provider}</Text>
        <Text style={styles.cardTitle}>{result.title}</Text>
        {result.subtitle && (
          <Text style={styles.cardSubtitle}>{result.subtitle}</Text>
        )}
        {description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {description}
          </Text>
        )}
        <View style={styles.cardFooter}>
          {priceLabel && <Text style={styles.price}>{priceLabel}</Text>}
          {typeof result.rating === 'number' && (
            <Text style={styles.rating}>★ {result.rating.toFixed(1)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrvoTheme.background },
  header: { padding: 20, paddingBottom: 12, gap: 8 },
  emoji: { fontSize: 36 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: OrvoTheme.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: OrvoTheme.mutedForeground,
    marginBottom: 8,
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
  filterRowContainer: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OrvoTheme.border,
    backgroundColor: OrvoTheme.muted,
  },
  chipActive: {
    backgroundColor: OrvoTheme.primary,
    borderColor: OrvoTheme.primary,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: OrvoTheme.mutedForeground,
  },
  chipLabelActive: {
    color: OrvoTheme.primaryForeground,
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
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: OrvoTheme.muted,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: OrvoTheme.border,
  },
  cardBody: {
    padding: 16,
  },
  provider: {
    fontSize: 11,
    fontWeight: '600',
    color: OrvoTheme.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: OrvoTheme.foreground,
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: OrvoTheme.mutedForeground,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: OrvoTheme.mutedForeground,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: OrvoTheme.foreground,
  },
  rating: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
