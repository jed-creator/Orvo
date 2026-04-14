import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/types';
import { ServaTheme } from '@/constants/serva-theme';

interface SearchRow extends Business {
  category: { name: string | null } | null;
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async (text: string, categorySlug?: string) => {
    setLoading(true);
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
      // Filter by joined category slug using the `category:categories` relation
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      if (cat) {
        req = req.eq('category_id', cat.id);
      }
    }
    const { data } = await req.order('avg_rating', { ascending: false }).limit(30);
    setResults((data ?? []) as unknown as SearchRow[]);
    setLoading(false);
  };

  useEffect(() => {
    runSearch('', params.category);
  }, [params.category]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses by name…"
          placeholderTextColor={ServaTheme.mutedForeground}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query, params.category)}
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
          <ActivityIndicator color={ServaTheme.accent} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No businesses found.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/business/[id]',
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.bizName}>{item.name}</Text>
              {item.category?.name && (
                <Text style={styles.bizCategory}>{item.category.name}</Text>
              )}
              {item.description && (
                <Text style={styles.bizDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <Text style={styles.bizRating}>
                ★ {Number(item.avg_rating).toFixed(1)}{' '}
                <Text style={styles.bizReviews}>
                  ({item.total_reviews} reviews)
                </Text>
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ServaTheme.background },
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: ServaTheme.foreground,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: ServaTheme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: ServaTheme.foreground,
  },
  filterPill: {
    fontSize: 13,
    color: ServaTheme.accent,
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
    color: ServaTheme.mutedForeground,
  },
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: ServaTheme.muted,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  bizName: {
    fontSize: 17,
    fontWeight: '600',
    color: ServaTheme.foreground,
  },
  bizCategory: {
    fontSize: 12,
    color: ServaTheme.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  bizDesc: {
    fontSize: 14,
    color: ServaTheme.mutedForeground,
    marginTop: 6,
  },
  bizRating: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 8,
  },
  bizReviews: {
    color: ServaTheme.mutedForeground,
    fontWeight: '400',
  },
});
